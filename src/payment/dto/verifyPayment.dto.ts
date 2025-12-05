import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// eSewa callback query parameters
export class EsewaVerifyDto {
  @IsNotEmpty()
  @IsString()
  oid: string; // Our reference ID

  @IsNotEmpty()
  @IsString()
  amt: string; // Amount

  @IsNotEmpty()
  @IsString()
  refId: string; // eSewa transaction reference

  @IsOptional()
  @IsString()
  scd?: string; // Merchant code
}

// Khalti callback/verification
export class KhaltiVerifyDto {
  @IsNotEmpty()
  @IsString()
  pidx: string; // Payment ID from Khalti

  @IsOptional()
  @IsString()
  transaction_id?: string;

  @IsOptional()
  @IsString()
  tidx?: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  total_amount?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  purchase_order_id?: string;

  @IsOptional()
  @IsString()
  purchase_order_name?: string;
}
