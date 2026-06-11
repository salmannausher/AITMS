'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DriverDrawer } from './DriverDrawer';
import { TruckDrawer } from './TruckDrawer';

type DriverStatus = 'AVAILABLE' | 'ON_LOAD' | 'OFF_DUTY';
type TruckType = 'DRY_VAN' | 'REEFER' | 'FLATBED' | 'STEP_DECK' | 'LOWBOY' | 'TANKER' | 'OTHER';
type TruckStatus = 'AVAILABLE' | 'IN_USE' | 'OUT_OF_SERVICE';

export type Driver = {
  id: string;
  full_name: string;
  phone: string;
  cdl_class: 'A' | 'B' | 'C';
  endorsements: string[];
  home_city: string;
  home_state: string;
  hos_remaining_hours: number;
  hos_reset_at: string | null;
  status: DriverStatus;
  assigned_truck_id: string | null;
  whatsapp_phone: string | null;
  truck: { id: string; unit_number: string; type: TruckType; status: TruckStatus } | null;
};

export type Truck = {
  id: string;
  unit_number: string;
  type: TruckType;
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  status: TruckStatus;
  driver: { id: string; full_name: string; status: DriverStatus } | null;
};

const STATUS_BADGE: Record<DriverStatus, { label: string; className: string }> = {
  AVAILABLE: { label: 'Available', className: 'bg-green-100 text-green-800 border-green-200' },
  ON_LOAD: { label: 'On Load', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  OFF_DUTY: { label: 'Off Duty', className: 'bg-red-100 text-red-800 border-red-200' },
};

const TRUCK_STATUS_BADGE: Record<TruckStatus, { label: string; className: string }> = {
  AVAILABLE: { label: 'Available', className: 'bg-green-100 text-green-800 border-green-200' },
  IN_USE: { label: 'In Use', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  OUT_OF_SERVICE: { label: 'Out of Service', className: 'bg-red-100 text-red-800 border-red-200' },
};

const TRUCK_TYPE_LABELS: Record<TruckType, string> = {
  DRY_VAN: 'Dry Van',
  REEFER: 'Reefer',
  FLATBED: 'Flatbed',
  STEP_DECK: 'Step Deck',
  LOWBOY: 'Lowboy',
  TANKER: 'Tanker',
  OTHER: 'Other',
};

function HosBar({ hours }: { hours: number }) {
  const pct = Math.min(100, Math.round((hours / 70) * 100));
  const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{hours.toFixed(0)}h</span>
    </div>
  );
}

type Props = {
  initialDrivers: unknown[];
  initialTrucks: unknown[];
};

export function DriverBoardClient({ initialDrivers, initialTrucks }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers as Driver[]);
  const [trucks, setTrucks] = useState<Truck[]>(initialTrucks as Truck[]);

  const [driverDrawerOpen, setDriverDrawerOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [truckDrawerOpen, setTruckDrawerOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);

  async function refetch() {
    const [dr, tr] = await Promise.all([
      fetch('/api/drivers').then((r) => r.json() as Promise<Driver[]>),
      fetch('/api/trucks').then((r) => r.json() as Promise<Truck[]>),
    ]);
    setDrivers(dr);
    setTrucks(tr);
  }

  function openAddDriver() {
    setEditingDriver(null);
    setDriverDrawerOpen(true);
  }

  function openEditDriver(driver: Driver) {
    setEditingDriver(driver);
    setDriverDrawerOpen(true);
  }

  function openAddTruck() {
    setEditingTruck(null);
    setTruckDrawerOpen(true);
  }

  function openEditTruck(truck: Truck) {
    setEditingTruck(truck);
    setTruckDrawerOpen(true);
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Drivers & Fleet</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {drivers.filter((d) => d.status === 'AVAILABLE').length} available ·{' '}
          {drivers.filter((d) => d.status === 'ON_LOAD').length} on load ·{' '}
          {trucks.filter((t) => t.status === 'AVAILABLE').length} trucks available
        </p>
      </div>

      <Tabs defaultValue="drivers">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="drivers">Drivers ({drivers.length})</TabsTrigger>
            <TabsTrigger value="fleet">Fleet ({trucks.length})</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={openAddTruck}>
              Add Truck
            </Button>
            <Button size="sm" onClick={openAddDriver}>
              Add Driver
            </Button>
          </div>
        </div>

        <TabsContent value="drivers">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>CDL</TableHead>
                <TableHead>Truck</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>HOS Remaining</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No drivers yet. Add your first driver.
                  </TableCell>
                </TableRow>
              )}
              {drivers.map((driver) => {
                const badge = STATUS_BADGE[driver.status];
                return (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{driver.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        CDL-{driver.cdl_class}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {driver.truck ? driver.truck.unit_number : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.className}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <HosBar hours={driver.hos_remaining_hours} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDriver(driver)}
                        >
                          Edit
                        </Button>
                        <Link
                          href={`/loads?driver=${driver.id}`}
                          className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                        >
                          Loads
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="fleet">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Make / Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Driver</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {trucks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No trucks yet. Add your first truck.
                  </TableCell>
                </TableRow>
              )}
              {trucks.map((truck) => {
                const badge = TRUCK_STATUS_BADGE[truck.status];
                return (
                  <TableRow key={truck.id}>
                    <TableCell className="font-medium">{truck.unit_number}</TableCell>
                    <TableCell>{TRUCK_TYPE_LABELS[truck.type]}</TableCell>
                    <TableCell className="text-muted-foreground">{truck.year ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {truck.make && truck.model
                        ? `${truck.make} ${truck.model}`
                        : truck.make ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.className}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {truck.driver ? truck.driver.full_name : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditTruck(truck)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <DriverDrawer
        open={driverDrawerOpen}
        driver={editingDriver}
        trucks={trucks}
        onClose={() => setDriverDrawerOpen(false)}
        onSuccess={() => {
          setDriverDrawerOpen(false);
          void refetch();
        }}
      />

      <TruckDrawer
        open={truckDrawerOpen}
        truck={editingTruck}
        onClose={() => setTruckDrawerOpen(false)}
        onSuccess={() => {
          setTruckDrawerOpen(false);
          void refetch();
        }}
      />
    </>
  );
}
