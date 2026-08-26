CREATE TABLE `operational_baselines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int,
	`meterId` int NOT NULL,
	`label` varchar(160) NOT NULL,
	`resourceType` enum('energy','water','waste') NOT NULL,
	`unit` varchar(24) NOT NULL,
	`aggregateValue` decimal(18,4) NOT NULL,
	`readingCount` int NOT NULL,
	`latestObservedAt` timestamp NOT NULL,
	`includesSimulatedEvidence` boolean NOT NULL DEFAULT false,
	`windowStart` timestamp NOT NULL,
	`windowEnd` timestamp NOT NULL,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operational_baselines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `operational_baselines` ADD CONSTRAINT `operational_baselines_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operational_baselines` ADD CONSTRAINT `operational_baselines_siteId_sites_id_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operational_baselines` ADD CONSTRAINT `operational_baselines_meterId_meters_id_fk` FOREIGN KEY (`meterId`) REFERENCES `meters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operational_baselines` ADD CONSTRAINT `operational_baselines_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `baselines_org_created_idx` ON `operational_baselines` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `baselines_org_meter_window_idx` ON `operational_baselines` (`organizationId`,`meterId`,`windowStart`,`windowEnd`);--> statement-breakpoint
CREATE INDEX `baselines_site_idx` ON `operational_baselines` (`siteId`);