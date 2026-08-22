CREATE TABLE `alert_escalation_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`minimumSeverity` enum('low','medium','high','critical') NOT NULL DEFAULT 'critical',
	`afterMinutes` int NOT NULL DEFAULT 60,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_escalation_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_escalation_policy_org_unique` UNIQUE(`organizationId`)
);
--> statement-breakpoint
CREATE TABLE `alert_escalations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`alertId` int NOT NULL,
	`policyId` int,
	`actionId` int,
	`status` enum('pending','triggered','suppressed','resolved') NOT NULL DEFAULT 'pending',
	`dueAt` timestamp NOT NULL,
	`triggeredAt` timestamp,
	`resolvedAt` timestamp,
	`reason` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_escalations_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_escalations_alert_unique` UNIQUE(`alertId`)
);
--> statement-breakpoint
ALTER TABLE `alert_escalation_policies` ADD CONSTRAINT `alert_escalation_policy_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_escalation_policies` ADD CONSTRAINT `alert_escalation_policy_user_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_escalations` ADD CONSTRAINT `alert_escalation_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_escalations` ADD CONSTRAINT `alert_escalation_alert_fk` FOREIGN KEY (`alertId`) REFERENCES `monitoring_alerts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_escalations` ADD CONSTRAINT `alert_escalation_policy_fk` FOREIGN KEY (`policyId`) REFERENCES `alert_escalation_policies`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_escalations` ADD CONSTRAINT `alert_escalation_action_fk` FOREIGN KEY (`actionId`) REFERENCES `sustainability_actions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `alert_escalations_org_status_due_idx` ON `alert_escalations` (`organizationId`,`status`,`dueAt`);--> statement-breakpoint
CREATE INDEX `alert_escalations_action_idx` ON `alert_escalations` (`actionId`);
