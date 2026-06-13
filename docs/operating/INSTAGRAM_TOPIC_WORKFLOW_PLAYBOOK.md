# Instagram Topic Workflow Playbook

> Scope: carousel MD/JSON topic selection only. No image generation, no HTML, no publishing automation.

## Hard Rule

Never create a carousel MD from hook strength alone.

Every topic must pass all four gates before MD creation:

1. Brand Fit: the problem naturally leads to Munjanggun door, middle-door, ABS door, front-door, molding, or free measurement consultation.
2. Reality Fit: the causal chain is credible in a real Korean apartment.
3. Duplication Fit: the premise is meaningfully different from existing carousel topics.
4. Timing Fit: the topic fits the current season or is evergreen.

If any gate fails, stop at the planning stage and do not create an MD file.

## Commands

Run before topic selection:

```bash
npm run status
```

Run after any MD creation or data change:

```bash
npm run validate
npm run status
```

When production-ready topics drop below the configured threshold, the status report shows `후보 보강 제안`.
Those rows are replenishment seeds, not approved topics. Promote a seed into `PROBLEM_BANK.md` and `PROBLEM_QUALITY_RULES.json` only after brand fit, reality fit, and duplication fit are checked.

## Topic Status

Topic status is controlled by:

```text
data/problems/PROBLEM_QUALITY_RULES.json
```

| Status | Meaning | MD Creation |
|---|---|---|
| active | Production candidate | Allowed after approval or explicit delegation |
| used | Already used | Blocked unless reuse_allowed is true |
| rejected | Brand/reality failure | Forbidden |
| hold | Needs evidence or narrower angle | Forbidden |
| duplicate_hold | Too close to existing topic | Forbidden |
| season_hold | Good topic, wrong timing | Forbidden until timing changes |

## Approval Rules

User approval can skip only the planning confirmation step.

It can never skip:

- `PROBLEM_QUALITY_RULES.json`
- brand fit check
- reality fit check
- duplication check
- `npm run validate`

Even if the user says "바로 만들어", "MD까지 만들어", or "승인 없이 진행", blocked topics must not become MD files.

## Duplicate Rules

Use `semantic_cluster`, not just category.

| Existing Cluster | Blocks |
|---|---|
| `pet_hallway_noise` | pet hallway waiting, pet escape, pet hallway barking |
| `child_hallway_noise` | child hallway safety unless a concrete product option is the main point |
| `kitchen_smell` | food smell, fish smell, guest visit smell |
| `bathroom_door_rot` | bathroom door swelling, rotting, mold unless a distinct physical defect is shown |

## Rejected Topic Rules

These topic types are forbidden unless rewritten through an allowed product-specific problem:

- kitchen food smell
- pet body odor
- bathroom drain smell
- basement parking moisture reaching the apartment door
- floor-noise complaints solved by a middle door
- generic interior advice without a door/middle-door purchase reason

## Required MD Fields

For all new v5 carousel MD files:

- `problem_bank_ref`
- `hook_type`
- `hook_score`
- `hook_score_reason`
- `target_persona`
- `variation_angle`
- `duplicate_signature`
- `cta_type`
- `visual_intent`
- `slides`

## Registry Update Rule

After MD creation, update:

1. `data/registry/INSTAGRAM_POSTING_REGISTRY.md`
2. `data/problems/PROBLEM_BANK.md`
3. `data/problems/PROBLEM_QUALITY_RULES.json` if a topic becomes used, blocked, or newly approved
4. `data/planning/INSTAGRAM_TOPIC_PLAN.md` when the topic changes the next queue

## Go / No-Go

GO:

- status report verdict is `우선검토` or `검토`
- quality rule status is `active`
- semantic cluster is not recently used
- user has approved the plan or explicitly delegated execution

NO-GO:

- verdict is `제작금지`, `브랜드부적합`, `중복주의`, `계절대기`, or `보류`
- status is `rejected`, `hold`, `duplicate_hold`, or `season_hold`
- topic relies on weak causality
- topic requires image generation or product rendering to make sense
