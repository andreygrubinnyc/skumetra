/**
 * The ten labels that drive the automation state machine.
 *
 * Kept as data rather than as a README instruction so the set can be applied
 * reproducibly and diffed. Colours group them by meaning: green = a person has
 * authorised something, blue = automation is working, amber = a person is
 * needed, red = something failed or is off-limits.
 */
import { LABELS } from './automation-core.mjs'

export const LABEL_DEFINITIONS = [
  {
    name: LABELS.READY,
    color: '0e8a16',
    description: 'Owner authorises Claude to implement this issue.',
  },
  {
    name: LABELS.APPROVED,
    color: '0e8a16',
    description: 'Owner approves merging the reviewed commit. Automation merges that exact SHA.',
  },
  {
    name: LABELS.IN_PROGRESS,
    color: '1d76db',
    description: 'Claude is implementing this issue. Applied and removed by automation.',
  },
  {
    name: LABELS.MANAGED,
    color: '1d76db',
    description: 'Pull request produced by Claude automation.',
  },
  {
    name: LABELS.OWNER_REVIEW,
    color: 'fbca04',
    description: 'Ready for the owner review. This is decision two of two.',
  },
  {
    name: LABELS.BLOCKED,
    color: 'fbca04',
    description: 'Automation stopped and needs an owner decision before it can continue.',
  },
  {
    name: LABELS.AUTOMATION_FAILED,
    color: 'b60205',
    description: 'Automation could not complete the work. Needs investigation.',
  },
  {
    name: LABELS.PRODUCTION_FAILED,
    color: 'b60205',
    description: 'Merged, but production verification failed. No automatic rollback was performed.',
  },
  {
    name: LABELS.PRIVATE,
    color: 'b60205',
    description: 'Involves real seller, supplier, prospect or applicant data. Automation must never run.',
  },
  {
    name: LABELS.COMPLETED,
    color: '5319e7',
    description: 'Merged and verified live in production.',
  },
]
