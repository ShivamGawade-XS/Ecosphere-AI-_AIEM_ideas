CREATE TABLE `maintenance_windows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`meterId` int NOT NULL,
	`label` varchar(160) NOT NULL,
	`reason` text NOT NULL,
	`windowStart` timestamp NOT NULL,
	`windowEnd` timestamp NOT NULL,
	`cancelledAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `maintenance_windows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `anomaly_events` ADD `alertSuppressedByMaintenanceWindowId` int;--> statement-breakpoint
ALTER TABLE `maintenance_windows` ADD CONSTRAINT `maintenance_windows_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_windows` ADD CONSTRAINT `maintenance_windows_meterId_meters_id_fk` FOREIGN KEY (`meterId`) REFERENCES `meters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_windows` ADD CONSTRAINT `maintenance_windows_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `maintenance_windows_org_meter_time_idx` ON `maintenance_windows` (`organizationId`,`meterId`,`windowStart`,`windowEnd`);