import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';

/**
 * Attach the required permission atom to the route handler.
 * Example: @RequiresPermission('users:read')
 */
export const RequiresPermission = (atom: string) =>
  SetMetadata(PERMISSION_KEY, atom);
