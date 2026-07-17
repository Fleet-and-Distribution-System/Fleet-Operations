import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';

// As Drivers/Customers/Orders/Trips/Waybills modules are built (see README roadmap),
// import them here following the exact same shape as VehiclesModule.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    VehiclesModule,
  ],
})
export class AppModule {}
