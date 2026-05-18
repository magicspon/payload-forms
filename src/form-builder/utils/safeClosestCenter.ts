import type { CollisionDetection } from '@dnd-kit/core'

import { closestCenter } from '@dnd-kit/core'

export const safeClosestCenter: CollisionDetection = (args) =>
  closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(Boolean),
  })
