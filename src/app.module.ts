import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { DriversModule } from './drivers/drivers.module';
import { CustomersModule } from './customers/customers.module';
import { OrdersModule } from './orders/orders.module';
import { TripsModule } from './trips/trips.module';
import { WaybillsModule } from './waybills/waybills.module';
import { LocationsModule } from './locations/locations.module';
import { CompaniesModule } from './companies/companies.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    VehiclesModule,
    DriversModule,
    CustomersModule,
    OrdersModule,
    TripsModule,
    WaybillsModule,
    LocationsModule,
    CompaniesModule,
    TrackingModule,
  ],
})
export class AppModule {}
