CREATE TABLE `operating_calendar_windows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`meterId` int NOT NULL,
	`label` varchar(160) NOT NULL,
	`timezone` varchar(64) NOT NULL,
	`weekdays` json NOT NULL,
	`startMinuteLocal` int NOT NULL,
	`endMinuteLocal` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operating_calendar_windows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `operating_calendar_windows` ADD CONSTRAINT `operating_calendar_windows_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operating_calendar_windows` ADD CONSTRAINT `operating_calendar_windows_meterId_meters_id_fk` FOREIGN KEY (`meterId`) REFERENCES `meters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operating_calendar_windows` ADD CONSTRAINT `operating_calendar_windows_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `operating_calendar_org_meter_active_idx` ON `operating_calendar_windows` (`organizationId`,`meterId`,`isActive`);