CREATE TABLE `demo_simulation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int,
	`status` enum('running','spike_injected','reset') NOT NULL DEFAULT 'running',
	`cycle` int NOT NULL DEFAULT 0,
	`anchorObservedAt` timestamp NOT NULL,
	`createdByUserId` int,
	`spikeInjectedAt` timestamp,
	`resetAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `demo_simulation_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `demo_simulation_sessions` ADD CONSTRAINT `demo_sessions_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `demo_simulation_sessions` ADD CONSTRAINT `demo_sessions_site_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `demo_simulation_sessions` ADD CONSTRAINT `demo_sessions_user_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `demo_sessions_org_status_idx` ON `demo_simulation_sessions` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `demo_sessions_org_created_idx` ON `demo_simulation_sessions` (`organizationId`,`createdAt`);
