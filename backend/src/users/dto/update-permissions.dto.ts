import {
  IsArray,
  IsString,
  ArrayMinSize,
  ArrayUnique,
} from 'class-validator';

export class UpdatePermissionsDto {
  /**
   * The full list of permission atoms to assign to the target user.
   * This REPLACES the user's existing permissions.
   * Example: ["users:read", "leads:view", "reports:export"]
   */
  @IsArray()
  @ArrayMinSize(0)
  @ArrayUnique()
  @IsString({ each: true })
  atoms: string[];
}
