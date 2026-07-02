import { pgTable, serial, uuid, text, timestamp, boolean, real, integer, jsonb, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Usuários
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Papéis (RBAC)
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
});

// Perfis
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone'),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notificações por usuário (alimentadas por eventos operacionais, ex.: alerts)
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('info'),
  title: text('title').notNull(),
  message: text('message'),
  link: text('link'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Configurações por usuário (jsonb para evitar churn de migração)
export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').default({}),
  notifications: jsonb('notifications').default({}),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relatórios persistidos (geração síncrona; conteúdo em jsonb)
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull(),
  params: jsonb('params').default({}),
  status: text('status').default('completed'),
  content: jsonb('content'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Veículos
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  plate: text('plate').notNull().unique(),
  model: text('model'),
  year: text('year'),
  color: text('color'),
  deviceImei: text('device_imei').unique(),
  deviceModel: text('device_model'),
  deviceSim: text('device_sim'),
  deviceLastMaintenance: timestamp('device_last_maintenance'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Status dos veículos
export const vehicleStatus = pgTable('vehicle_status', {
  vehicleId: integer('vehicle_id').primaryKey().references(() => vehicles.id, { onDelete: 'cascade' }),
  status: text('status').default('offline'),
  isMoving: boolean('is_moving').default(false),
  lastUpdate: timestamp('last_update'),
  lat: real('lat'),
  lng: real('lng'),
  address: text('address'),
  speed: real('speed').default(0),
  heading: real('heading'),
  altitude: real('altitude'),
  accuracy: real('accuracy'),
  satellites: integer('satellites'),
  odometer: real('odometer'),
  engineHours: real('engine_hours'),
  fuelLevel: real('fuel_level'),
  batteryLevel: real('battery_level'),
  temperature: real('temperature'),
  ignition: boolean('ignition').default(false),
  panic: boolean('panic').default(false),
  armed: boolean('armed').default(false),
  geofenceIds: text('geofence_ids'),
  attributes: jsonb('attributes'),
});

// Viagens
export const trips = pgTable('trips', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  startLat: real('start_lat'),
  startLng: real('start_lng'),
  endLat: real('end_lat'),
  endLng: real('end_lng'),
  startAddress: text('start_address'),
  endAddress: text('end_address'),
  distance: real('distance').default(0),
  duration: integer('duration').default(0),
  maxSpeed: real('max_speed').default(0),
  avgSpeed: real('avg_speed').default(0),
  fuelConsumed: real('fuel_consumed'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Eventos
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  tripId: integer('trip_id').references(() => trips.id, { onDelete: 'set null' }),
  type: text('type').notNull(),
  description: text('description'),
  lat: real('lat'),
  lng: real('lng'),
  address: text('address'),
  speed: real('speed'),
  heading: real('heading'),
  attributes: jsonb('attributes'),
  timestamp: timestamp('timestamp').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Alertas
export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  eventId: integer('event_id').references(() => events.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  severity: text('severity').default('medium'),
  title: text('title').notNull(),
  message: text('message'),
  isRead: boolean('is_read').default(false),
  isResolved: boolean('is_resolved').default(false),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  attributes: jsonb('attributes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Geofences
export const geofences = pgTable('geofences', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'circle', 'polygon'
  coordinates: jsonb('coordinates').notNull(),
  radius: real('radius'), // para círculos
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Comandos para veículos
export const commands = pgTable('commands', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'engine_stop', 'engine_start', 'lock', 'unlock', etc.
  status: text('status').default('pending'), // 'pending', 'sent', 'executed', 'failed'
  parameters: jsonb('parameters'),
  sentAt: timestamp('sent_at'),
  executedAt: timestamp('executed_at'),
  response: jsonb('response'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relações
export const usersRelations = relations(users, ({ many, one }) => ({
  profile: one(profiles),
  vehicles: many(vehicles),
  geofences: many(geofences),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.id],
    references: [users.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  user: one(users, {
    fields: [vehicles.userId],
    references: [users.id],
  }),
  status: one(vehicleStatus),
  trips: many(trips),
  events: many(events),
  alerts: many(alerts),
}));

export const vehicleStatusRelations = relations(vehicleStatus, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleStatus.vehicleId],
    references: [vehicles.id],
  }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [trips.vehicleId],
    references: [vehicles.id],
  }),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [events.vehicleId],
    references: [vehicles.id],
  }),
  trip: one(trips, {
    fields: [events.tripId],
    references: [trips.id],
  }),
  alerts: many(alerts),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [alerts.vehicleId],
    references: [vehicles.id],
  }),
  event: one(events, {
    fields: [alerts.eventId],
    references: [events.id],
  }),
  resolvedByUser: one(users, {
    fields: [alerts.resolvedBy],
    references: [users.id],
  }),
}));

export const geofencesRelations = relations(geofences, ({ one }) => ({
  user: one(users, {
    fields: [geofences.userId],
    references: [users.id],
  }),
}));

export const commandsRelations = relations(commands, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [commands.vehicleId],
    references: [vehicles.id],
  }),
  user: one(users, {
    fields: [commands.userId],
    references: [users.id],
  }),
}));

// Tipos TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type VehicleStatus = typeof vehicleStatus.$inferSelect;
export type NewVehicleStatus = typeof vehicleStatus.$inferInsert;
export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type Geofence = typeof geofences.$inferSelect;
export type NewGeofence = typeof geofences.$inferInsert;
export type Command = typeof commands.$inferSelect;
export type NewCommand = typeof commands.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;