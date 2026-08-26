CREATE TABLE `campus_equipment_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int NOT NULL,
	`meterId` int,
	`assetKey` varchar(96) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`assetType` varchar(80) NOT NULL,
	`locationDescription` varchar(240),
	`lifecycleStatus` varchar(32) NOT NULL DEFAULT 'active',
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campus_equipment_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_assets_org_key_unique` UNIQUE(`organizationId`,`assetKey`)
);
--> statement-breakpoint
ALTER TABLE `campus_equipment_assets` ADD CONSTRAINT `campus_equipment_assets_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campus_equipment_assets` ADD CONSTRAINT `campus_equipment_assets_siteId_sites_id_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campus_equipment_assets` ADD CONSTRAINT `campus_equipment_assets_meterId_meters_id_fk` FOREIGN KEY (`meterId`) REFERENCES `meters`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campus_equipment_assets` ADD CONSTRAINT `campus_equipment_assets_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `equipment_assets_org_status_idx` ON `campus_equipment_assets` (`organizationId`,`lifecycleStatus`);--> statement-breakpoint
CREATE INDEX `equipment_assets_site_idx` ON `campus_equipment_assets` (`siteId`);--> statement-breakpoint
CREATE INDEX `equipment_assets_meter_idx` ON `campus_equipment_assets` (`meterId`);