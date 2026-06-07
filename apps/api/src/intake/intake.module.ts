import { Module } from '@nestjs/common';

// IntakeModule has no providers — DI is handled via the factory pattern
// in intake.functions.ts, which is registered in InngestModule.
@Module({})
export class IntakeModule {}
