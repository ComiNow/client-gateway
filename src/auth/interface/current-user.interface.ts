export interface CurrentUser {
  id: string;
  identificationNumber: string;
  fullName: string;
  roleId: string;
  roleName?: string;
}
