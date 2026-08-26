CREATE TABLE `outcome_measurements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`actionId` int NOT NULL,
	`scenarioId` int NOT NULL,
	`baselineId` int NOT NULL,
	`meterId` int NOT NULL,
	`resourceType` enum('energy','water','waste') NOT NULL,
	`unit` varchar(24) NOT NULL,
	`baselineValue` decimal(18,4) NOT NULL,
	`baselineReadingCount` int NOT NULL,
	`baselineWindowStart` timestamp NOT NULL,
	`baselineWindowEnd` timestamp NOT NULL,
	`outcomeValue` decimal(18,4) NOT NULL,
	`outcomeReadingCount` int NOT NULL,
	`latestOutcomeObservedAt` timestamp NOT NULL,
	`outcomeWindowStart` timestamp NOT NULL,
	`outcomeWindowEnd` timestamp NOT NULL,
	`includesSimulatedEvidence` boolean NOT NULL DEFAULT false,
	`status` enum('comparable','simulated_evidence') NOT NULL,
	`results` json NOT NULL,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outcome_measurements_id` PRIMARY KEY(`id`),
	CONSTRAINT `outcome_measurements_action_unique` UNIQUE(`actionId`)
);
--> statement-breakpoint
ALTER TABLE `outcome_measurements` ADD CONSTRAINT `outcome_measurements_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outcome_measurements` ADD CONSTRAINT `outcome_measurements_actionId_sustainability_actions_id_fk` FOREIGN KEY (`actionId`) REFERENCES `sustainability_actions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outcome_measurements` ADD CONSTRAINT `outcome_measurements_scenarioId_sustainability_scenarios_id_fk` FOREIGN KEY (`scenarioId`) REFERENCES `sustainability_scenarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outcome_measurements` ADD CONSTRAINT `outcome_measurements_baselineId_operational_baselines_id_fk` FOREIGN KEY (`baselineId`) REFERENCES `operational_baselines`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outcome_measurements` ADD CONSTRAINT `outcome_measurements_meterId_meters_id_fk` FOREIGN KEY (`meterId`) REFERENCES `meters`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outcome_measurements` ADD CONSTRAINT `outcome_measurements_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `outcome_measurements_org_created_idx` ON `outcome_measurements` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `outcome_measurements_org_meter_idx` ON `outcome_measurements` (`organizationId`,`meterId`);