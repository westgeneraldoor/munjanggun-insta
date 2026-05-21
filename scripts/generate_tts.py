#!/usr/bin/env python3
"""generate_tts.py — shortform_package.md에서 TTS 텍스트를 추출하여 Google AI Studio TTS로 WAV 생성

Usage:
    python scripts/generate_tts.py 007
    python scripts/generate_tts.py 007 --voice Algieba
    python scripts/generate_tts.py 007 --voice Algieba --style custom
"""
import sys
import os
import re
import glob
import wave
import base64
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# -- Config --
API_KEY = os.environ.get("GEMINI_API_KEY")
DEFAULT_VOICE = "Algieba"  # Gravelly, male
MODEL = "gemini-3.1-flash-tts-preview"
SAMPLE_RATE = 24000
CHANNELS = 1
SAMPLE_WIDTH = 2

# -- Style Presets --
# Gemini TTS는 프롬프트 앞에 스타일 지시를 자연어로 넣으면 감정/속도/톤 조절 가능
STYLE_PRESETS = {
    "munjanggun": (
        "Read the following Korean script as a short-form video narration. "
        "You are a confident, experienced home renovation expert talking directly to worried homeowners. "
        "Speak at a brisk 1.2x pace — energetic but not rushed. "
        "Use a medium-low, gravelly tone with rich emotional variation: "
        "empathetic and understanding when describing customer worries, "
        "then switch to confident, reassuring, and slightly upbeat when presenting solutions. "
        "Add natural pauses between key points for emphasis. "
        "Never sound monotone or robotic. Sound like a real person passionately explaining their craft. "
        "The text to read:\n\n"
    ),
    "calm": (
        "Read the following Korean text in a calm, warm, professional tone. "
        "Speak at normal pace with gentle emphasis on key points. "
        "Sound trustworthy and approachable.\n\n"
    ),
    "energetic": (
        "Read the following Korean text with high energy and enthusiasm. "
        "Speak at 1.3x speed, upbeat and exciting. "
        "Sound like a passionate presenter on a home renovation show.\n\n"
    ),
    "none": ""  # No style prefix — raw text only
}

DEFAULT_STYLE = "munjanggun"

def find_package(arg):
    if os.path.isfile(arg):
        return os.path.abspath(arg)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Check new instagram/content/ structure (v3.0)
    insta_dir = os.path.join(project_root, 'instagram', 'content')
    pattern_insta = os.path.join(insta_dir, f"{arg}_*", "shortform_package.md")
    matches_insta = glob.glob(pattern_insta)
    if matches_insta:
        return matches_insta[0]

    # Check legacy posts/ structure
    posts_dir = os.path.join(project_root, 'posts')
    pattern = os.path.join(posts_dir, f"{arg}_*", "instagram", "shortform_package.md")
    matches = glob.glob(pattern)
    if matches:
        return matches[0]
    return None

def extract_tts_text(content):
    match = re.search(
        r'<!--\s*TTS_START\s*-->\s*\n(.*?)\n\s*<!--\s*TTS_END\s*-->',
        content, re.DOTALL
    )
    if match:
        return match.group(1).strip()
    return None

def save_wave(filename, pcm_data):
    with wave.open(filename, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm_data)

def generate_tts(text, voice, style_prefix, wav_path):
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=API_KEY)

    # Style prefix + actual text
    full_input = style_prefix + text

    response = client.models.generate_content(
        model=MODEL,
        contents=full_input,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice,
                    )
                )
            ),
        )
    )

    audio_data = response.candidates[0].content.parts[0].inline_data.data
    if isinstance(audio_data, bytes):
        pcm_bytes = audio_data
    else:
        pcm_bytes = base64.b64decode(audio_data)
    save_wave(wav_path, pcm_bytes)
    return len(pcm_bytes)

def generate_srt(text, wav_path, srt_path):
    with wave.open(wav_path, "rb") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        duration = frames / float(rate)

    sentences = [s.strip() for s in text.split('\n') if s.strip()]
    total_chars = sum(len(s) for s in sentences)

    current_time = 0.1
    srt_lines = []
    for i, sentence in enumerate(sentences, 1):
        char_ratio = len(sentence) / total_chars
        segment_duration = duration * char_ratio
        end_time = current_time + segment_duration

        start_str = format_srt_time(current_time)
        end_str = format_srt_time(end_time)
        srt_lines.append(f"{i}")
        srt_lines.append(f"{start_str} --> {end_str}")
        srt_lines.append(sentence)
        srt_lines.append("")
        current_time = end_time

    with open(srt_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(srt_lines))

def format_srt_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/generate_tts.py <post_number> [--voice Name] [--style preset]")
        print("Example: python scripts/generate_tts.py 007")
        print("         python scripts/generate_tts.py 007 --voice Algieba --style munjanggun")
        print(f"\nVoices: Algieba(Gravelly), Charon(Informative), Kore(Firm),")
        print(f"  Achird(Friendly), Sulafat(Warm), Orus(Firm), Gacrux(Mature)")
        print(f"\nStyles: {', '.join(STYLE_PRESETS.keys())}")
        sys.exit(1)

    arg = sys.argv[1]
    voice = DEFAULT_VOICE
    style_key = DEFAULT_STYLE

    if '--voice' in sys.argv:
        vi = sys.argv.index('--voice')
        if vi + 1 < len(sys.argv):
            voice = sys.argv[vi + 1]

    if '--style' in sys.argv:
        si = sys.argv.index('--style')
        if si + 1 < len(sys.argv):
            style_key = sys.argv[si + 1]

    style_prefix = STYLE_PRESETS.get(style_key, STYLE_PRESETS[DEFAULT_STYLE])

    md_path = find_package(arg)
    if not md_path:
        print(f"[ERROR] shortform_package.md not found: {arg}")
        sys.exit(1)

    print(f"[INPUT] {os.path.basename(md_path)}")

    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    tts_text = extract_tts_text(content)
    if not tts_text:
        print("[ERROR] TTS_START / TTS_END markers not found")
        sys.exit(1)

    print(f"[TTS] {len(tts_text)} chars | voice: {voice} | style: {style_key}")

    output_dir = os.path.dirname(md_path)
    wav_path = os.path.join(output_dir, "shortform.wav")
    srt_path = os.path.join(output_dir, "shortform.srt")

    print(f"[GEN] {MODEL} ...")
    audio_size = generate_tts(tts_text, voice, style_prefix, wav_path)
    print(f"[OK] WAV: {audio_size // 1024}KB")

    generate_srt(tts_text, wav_path, srt_path)
    print(f"[OK] SRT generated")

if __name__ == '__main__':
    main()
