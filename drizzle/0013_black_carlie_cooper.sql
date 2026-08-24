CREATE TABLE `iot_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int NOT NULL,
	`meterId` int NOT NULL,
	`deviceKey` varchar(96) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`credentialHash` varchar(128) NOT NULL,
	`credentialVersion` int NOT NULL DEFAULT 1,
	`status` enum('active','suspended','revoked','decommissioned') NOT NULL DEFAULT 'active',
	`lastSeenAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iot_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `iot_devices_org_key_unique` UNIQUE(`organizationId`,`deviceKey`)
);
--> statement-breakpoint
CREATE TABLE `iot_telemetry_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`deviceId` int NOT NULL,
	`readingId` int NOT NULL,
	`messageId` varchar(128) NOT NULL,
	`observedAt` timestamp NOT NULL,
	`payloadHash` varchar(128) NOT NULL,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iot_telemetry_receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `iot_receipts_device_message_unique` UNIQUE(`deviceId`,`messageId`)
);
--> statement-breakpoint
ALTER TABLE `iot_devices` ADD CONSTRAINT `iot_dev_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_devices` ADD CONSTRAINT `iot_dev_site_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_devices` ADD CONSTRAINT `iot_dev_meter_fk` FOREIGN KEY (`meterId`) REFERENCES `meters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_devices` ADD CONSTRAINT `iot_dev_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_telemetry_receipts` ADD CONSTRAINT `iot_rec_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_telemetry_receipts` ADD CONSTRAINT `iot_rec_device_fk` FOREIGN KEY (`deviceId`) REFERENCES `iot_devices`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_telemetry_receipts` ADD CONSTRAINT `iot_rec_reading_fk` FOREIGN KEY (`readingId`) REFERENCES `sustainability_readings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `iot_devices_meter_idx` ON `iot_devices` (`meterId`);--> statement-breakpoint
CREATE INDEX `iot_devices_org_status_idx` ON `iot_devices` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `iot_receipts_org_received_idx` ON `iot_telemetry_receipts` (`organizationId`,`receivedAt`);
