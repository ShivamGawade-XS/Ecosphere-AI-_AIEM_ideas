CREATE TABLE `intervention_comparisons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`scenarioIds` json NOT NULL,
	`results` json NOT NULL,
	`rankingVersion` varchar(64) NOT NULL,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `intervention_comparisons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sustainability_action_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`actionId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sustainability_action_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sustainability_action_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`actionId` int NOT NULL,
	`type` enum('note','url','attachment') NOT NULL,
	`label` varchar(240) NOT NULL,
	`reference` varchar(1024) NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sustainability_action_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sustainability_forecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int,
	`meterId` int NOT NULL,
	`method` enum('moving_average_v1') NOT NULL,
	`status` enum('ready','insufficient_data') NOT NULL,
	`horizonPoints` int NOT NULL,
	`inputReadingCount` int NOT NULL,
	`forecast` json NOT NULL,
	`backtest` json,
	`calculationVersion` varchar(64) NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sustainability_forecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sustainability_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int,
	`anomalyId` int,
	`forecastId` int,
	`actionId` int,
	`status` enum('proposed','accepted','dismissed','archived') NOT NULL DEFAULT 'proposed',
	`priority` enum('low','medium','high','critical') NOT NULL,
	`title` varchar(180) NOT NULL,
	`rationale` text NOT NULL,
	`expectedImpact` json NOT NULL,
	`evidence` json NOT NULL,
	`confidence` decimal(5,4) NOT NULL,
	`recommendationVersion` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sustainability_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sustainability_report_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`status` enum('generated','archived') NOT NULL DEFAULT 'generated',
	`criteria` json NOT NULL,
	`evidence` json NOT NULL,
	`factorDisclosure` text NOT NULL,
	`generatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sustainability_report_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `intervention_comparisons` ADD CONSTRAINT `ic_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `intervention_comparisons` ADD CONSTRAINT `ic_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_action_comments` ADD CONSTRAINT `sac_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_action_comments` ADD CONSTRAINT `sac_action_fk` FOREIGN KEY (`actionId`) REFERENCES `sustainability_actions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_action_comments` ADD CONSTRAINT `sac_author_fk` FOREIGN KEY (`authorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_action_evidence` ADD CONSTRAINT `sae_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_action_evidence` ADD CONSTRAINT `sae_action_fk` FOREIGN KEY (`actionId`) REFERENCES `sustainability_actions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_action_evidence` ADD CONSTRAINT `sae_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_forecasts` ADD CONSTRAINT `sf_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_forecasts` ADD CONSTRAINT `sf_site_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_forecasts` ADD CONSTRAINT `sf_meter_fk` FOREIGN KEY (`meterId`) REFERENCES `meters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_recommendations` ADD CONSTRAINT `sr_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_recommendations` ADD CONSTRAINT `sr_site_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_recommendations` ADD CONSTRAINT `sr_anomaly_fk` FOREIGN KEY (`anomalyId`) REFERENCES `anomaly_events`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_recommendations` ADD CONSTRAINT `sr_forecast_fk` FOREIGN KEY (`forecastId`) REFERENCES `sustainability_forecasts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_recommendations` ADD CONSTRAINT `sr_action_fk` FOREIGN KEY (`actionId`) REFERENCES `sustainability_actions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_report_snapshots` ADD CONSTRAINT `srs_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_report_snapshots` ADD CONSTRAINT `srs_creator_fk` FOREIGN KEY (`generatedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `comparisons_org_created_idx` ON `intervention_comparisons` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `action_comments_action_created_idx` ON `sustainability_action_comments` (`actionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `action_comments_org_created_idx` ON `sustainability_action_comments` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `action_evidence_action_created_idx` ON `sustainability_action_evidence` (`actionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `action_evidence_org_created_idx` ON `sustainability_action_evidence` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `forecasts_org_generated_idx` ON `sustainability_forecasts` (`organizationId`,`generatedAt`);--> statement-breakpoint
CREATE INDEX `forecasts_meter_generated_idx` ON `sustainability_forecasts` (`meterId`,`generatedAt`);--> statement-breakpoint
CREATE INDEX `recommendations_org_status_idx` ON `sustainability_recommendations` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `recommendations_anomaly_idx` ON `sustainability_recommendations` (`anomalyId`);--> statement-breakpoint
CREATE INDEX `recommendations_forecast_idx` ON `sustainability_recommendations` (`forecastId`);--> statement-breakpoint
CREATE INDEX `report_snapshots_org_created_idx` ON `sustainability_report_snapshots` (`organizationId`,`createdAt`);
