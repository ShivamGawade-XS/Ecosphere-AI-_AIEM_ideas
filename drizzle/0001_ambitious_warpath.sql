CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`actorUserId` int,
	`eventType` varchar(96) NOT NULL,
	`resourceType` varchar(96) NOT NULL,
	`resourceId` varchar(96),
	`payload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingestion_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`initiatedByUserId` int NOT NULL,
	`idempotencyKey` varchar(128) NOT NULL,
	`source` enum('manual','csv','api','connector','simulated') NOT NULL,
	`status` enum('processing','completed','completed_with_errors','failed') NOT NULL DEFAULT 'processing',
	`totalRows` int NOT NULL DEFAULT 0,
	`acceptedRows` int NOT NULL DEFAULT 0,
	`rejectedRows` int NOT NULL DEFAULT 0,
	`payloadHash` varchar(128),
	`errorSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `ingestion_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `ingestion_batches_org_key_unique` UNIQUE(`organizationId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `meters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int NOT NULL,
	`meterKey` varchar(96) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`resourceType` enum('energy','water','waste','fuel','renewable') NOT NULL,
	`canonicalUnit` varchar(24) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meters_id` PRIMARY KEY(`id`),
	CONSTRAINT `meters_org_key_unique` UNIQUE(`organizationId`,`meterKey`)
);
--> statement-breakpoint
CREATE TABLE `organization_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','manager','operator','viewer') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_memberships_org_user_unique` UNIQUE(`organizationId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(96) NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`code` varchar(64) NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sites_id` PRIMARY KEY(`id`),
	CONSTRAINT `sites_org_code_unique` UNIQUE(`organizationId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `sustainability_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int NOT NULL,
	`meterId` int NOT NULL,
	`ingestionBatchId` int,
	`observedAt` timestamp NOT NULL,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`value` decimal(16,4) NOT NULL,
	`unit` varchar(24) NOT NULL,
	`source` enum('manual','csv','api','connector','simulated') NOT NULL,
	`sourceReference` varchar(160),
	`idempotencyKey` varchar(160) NOT NULL,
	`qualityStatus` enum('accepted','flagged','rejected') NOT NULL DEFAULT 'accepted',
	`qualityReason` varchar(320),
	`provenance` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sustainability_readings_id` PRIMARY KEY(`id`),
	CONSTRAINT `readings_meter_key_unique` UNIQUE(`meterId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingestion_batches` ADD CONSTRAINT `ingestion_batches_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingestion_batches` ADD CONSTRAINT `ingestion_batches_initiatedByUserId_users_id_fk` FOREIGN KEY (`initiatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meters` ADD CONSTRAINT `meters_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meters` ADD CONSTRAINT `meters_siteId_sites_id_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_memberships` ADD CONSTRAINT `organization_memberships_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_memberships` ADD CONSTRAINT `organization_memberships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sites` ADD CONSTRAINT `sites_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_readings` ADD CONSTRAINT `sustainability_readings_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_readings` ADD CONSTRAINT `sustainability_readings_siteId_sites_id_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_readings` ADD CONSTRAINT `sustainability_readings_meterId_meters_id_fk` FOREIGN KEY (`meterId`) REFERENCES `meters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_readings` ADD CONSTRAINT `sustainability_readings_ingestionBatchId_ingestion_batches_id_fk` FOREIGN KEY (`ingestionBatchId`) REFERENCES `ingestion_batches`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_events_org_created_idx` ON `audit_events` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ingestion_batches_org_created_idx` ON `ingestion_batches` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `meters_site_idx` ON `meters` (`siteId`);--> statement-breakpoint
CREATE INDEX `organization_memberships_user_idx` ON `organization_memberships` (`userId`);--> statement-breakpoint
CREATE INDEX `sites_org_idx` ON `sites` (`organizationId`);--> statement-breakpoint
CREATE INDEX `readings_org_observed_idx` ON `sustainability_readings` (`organizationId`,`observedAt`);--> statement-breakpoint
CREATE INDEX `readings_meter_observed_idx` ON `sustainability_readings` (`meterId`,`observedAt`);