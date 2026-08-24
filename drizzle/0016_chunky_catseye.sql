CREATE TABLE `sustainability_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int,
	`targetType` enum('energy','water','waste','carbon','ecoscore') NOT NULL,
	`label` varchar(160) NOT NULL,
	`targetValue` decimal(16,4) NOT NULL,
	`unit` varchar(24) NOT NULL,
	`windowStart` timestamp NOT NULL,
	`windowEnd` timestamp NOT NULL,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sustainability_targets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sustainability_targets` ADD CONSTRAINT `targets_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_targets` ADD CONSTRAINT `targets_site_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_targets` ADD CONSTRAINT `targets_user_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `targets_org_status_idx` ON `sustainability_targets` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `targets_org_window_idx` ON `sustainability_targets` (`organizationId`,`windowStart`,`windowEnd`);--> statement-breakpoint
CREATE INDEX `targets_site_idx` ON `sustainability_targets` (`siteId`);
