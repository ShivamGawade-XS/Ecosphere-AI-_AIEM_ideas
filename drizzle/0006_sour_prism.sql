CREATE TABLE `alert_delivery_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`alertId` int NOT NULL,
	`routingPreferenceId` int,
	`channel` enum('owner_notification') NOT NULL,
	`status` enum('queued','delivered','failed','suppressed') NOT NULL DEFAULT 'queued',
	`attemptNumber` int NOT NULL DEFAULT 1,
	`errorSummary` varchar(500),
	`providerReference` varchar(160),
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	CONSTRAINT `alert_delivery_attempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_delivery_alert_channel_attempt_unique` UNIQUE(`alertId`,`channel`,`attemptNumber`)
);
--> statement-breakpoint
CREATE TABLE `alert_routing_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`channel` enum('owner_notification') NOT NULL DEFAULT 'owner_notification',
	`minimumSeverity` enum('low','medium','high','critical') NOT NULL DEFAULT 'high',
	`isEnabled` boolean NOT NULL DEFAULT false,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_routing_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_routing_org_channel_unique` UNIQUE(`organizationId`,`channel`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_recovery_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`monitoringRunId` int,
	`status` enum('open','retrying','resolved') NOT NULL DEFAULT 'open',
	`reason` varchar(500) NOT NULL,
	`retryRunKey` varchar(160),
	`attemptCount` int NOT NULL DEFAULT 0,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoring_recovery_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_service_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`targetKey` varchar(64) NOT NULL DEFAULT 'scheduled-monitoring',
	`expectedIntervalMinutes` int NOT NULL DEFAULT 15,
	`staleAfterMinutes` int NOT NULL DEFAULT 45,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoring_service_targets_id` PRIMARY KEY(`id`),
	CONSTRAINT `monitoring_targets_org_key_unique` UNIQUE(`organizationId`,`targetKey`)
);
--> statement-breakpoint
ALTER TABLE `alert_delivery_attempts` ADD CONSTRAINT `alert_delivery_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_delivery_attempts` ADD CONSTRAINT `alert_delivery_alert_fk` FOREIGN KEY (`alertId`) REFERENCES `monitoring_alerts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_delivery_attempts` ADD CONSTRAINT `alert_delivery_route_fk` FOREIGN KEY (`routingPreferenceId`) REFERENCES `alert_routing_preferences`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_routing_preferences` ADD CONSTRAINT `alert_route_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_routing_preferences` ADD CONSTRAINT `alert_route_user_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitoring_recovery_events` ADD CONSTRAINT `monitor_recovery_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitoring_recovery_events` ADD CONSTRAINT `monitor_recovery_run_fk` FOREIGN KEY (`monitoringRunId`) REFERENCES `monitoring_runs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitoring_service_targets` ADD CONSTRAINT `monitor_target_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitoring_service_targets` ADD CONSTRAINT `monitor_target_user_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `alert_delivery_org_requested_idx` ON `alert_delivery_attempts` (`organizationId`,`requestedAt`);--> statement-breakpoint
CREATE INDEX `alert_delivery_alert_idx` ON `alert_delivery_attempts` (`alertId`);--> statement-breakpoint
CREATE INDEX `monitoring_recovery_org_status_idx` ON `monitoring_recovery_events` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `monitoring_recovery_run_idx` ON `monitoring_recovery_events` (`monitoringRunId`);
