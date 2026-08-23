CREATE TABLE `anomaly_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int NOT NULL,
	`meterId` int NOT NULL,
	`readingId` int NOT NULL,
	`detectorVersion` varchar(32) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`baselineMean` decimal(16,4) NOT NULL,
	`baselineStdDev` decimal(16,4) NOT NULL,
	`observedValue` decimal(16,4) NOT NULL,
	`zScore` decimal(12,4) NOT NULL,
	`evidence` json,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledgedAt` timestamp,
	`resolvedAt` timestamp,
	CONSTRAINT `anomaly_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `anomaly_events_reading_detector_unique` UNIQUE(`readingId`,`detectorVersion`)
);
--> statement-breakpoint
CREATE TABLE `carbon_calculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`meterId` int NOT NULL,
	`readingId` int NOT NULL,
	`emittedKgCo2e` decimal(16,4) NOT NULL,
	`emissionFactor` decimal(16,6) NOT NULL,
	`factorVersion` varchar(48) NOT NULL,
	`calculationVersion` varchar(32) NOT NULL,
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `carbon_calculations_id` PRIMARY KEY(`id`),
	CONSTRAINT `carbon_calculations_reading_version_unique` UNIQUE(`readingId`,`calculationVersion`)
);
--> statement-breakpoint
CREATE TABLE `data_quality_findings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`meterId` int NOT NULL,
	`readingId` int NOT NULL,
	`ruleId` varchar(96) NOT NULL,
	`status` enum('passed','warning','failed') NOT NULL,
	`message` varchar(320) NOT NULL,
	`details` json,
	`evaluationVersion` varchar(32) NOT NULL,
	`evaluatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `data_quality_findings_id` PRIMARY KEY(`id`),
	CONSTRAINT `quality_findings_reading_rule_version_unique` UNIQUE(`readingId`,`ruleId`,`evaluationVersion`)
);
--> statement-breakpoint
CREATE TABLE `eco_score_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int,
	`score` int NOT NULL,
	`components` json NOT NULL,
	`calculationVersion` varchar(32) NOT NULL,
	`windowStart` timestamp,
	`windowEnd` timestamp,
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eco_score_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`anomalyId` int NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`acknowledgedByUserId` int,
	`acknowledgedAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monitoring_alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `monitoring_alerts_anomaly_unique` UNIQUE(`anomalyId`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`runKey` varchar(160) NOT NULL,
	`trigger` enum('manual','scheduled','cli') NOT NULL,
	`status` enum('running','completed','failed','skipped') NOT NULL DEFAULT 'running',
	`readingsScanned` int NOT NULL DEFAULT 0,
	`qualityFindingsCreated` int NOT NULL DEFAULT 0,
	`anomaliesCreated` int NOT NULL DEFAULT 0,
	`alertsCreated` int NOT NULL DEFAULT 0,
	`ecoScoresUpdated` int NOT NULL DEFAULT 0,
	`summary` json,
	`errorSummary` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `monitoring_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `monitoring_runs_org_key_unique` UNIQUE(`organizationId`,`runKey`)
);
--> statement-breakpoint
ALTER TABLE `anomaly_events` ADD CONSTRAINT `anomaly_events_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anomaly_events` ADD CONSTRAINT `anomaly_events_siteId_sites_id_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anomaly_events` ADD CONSTRAINT `anomaly_events_meterId_meters_id_fk` FOREIGN KEY (`meterId`) REFERENCES `meters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anomaly_events` ADD CONSTRAINT `anomaly_events_readingId_sustainability_readings_id_fk` FOREIGN KEY (`readingId`) REFERENCES `sustainability_readings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carbon_calculations` ADD CONSTRAINT `carbon_calculations_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carbon_calculations` ADD CONSTRAINT `carbon_calculations_meterId_meters_id_fk` FOREIGN KEY (`meterId`) REFERENCES `meters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carbon_calculations` ADD CONSTRAINT `carbon_calculations_readingId_sustainability_readings_id_fk` FOREIGN KEY (`readingId`) REFERENCES `sustainability_readings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_quality_findings` ADD CONSTRAINT `data_quality_findings_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_quality_findings` ADD CONSTRAINT `data_quality_findings_meterId_meters_id_fk` FOREIGN KEY (`meterId`) REFERENCES `meters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_quality_findings` ADD CONSTRAINT `data_quality_findings_readingId_sustainability_readings_id_fk` FOREIGN KEY (`readingId`) REFERENCES `sustainability_readings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `eco_score_snapshots` ADD CONSTRAINT `eco_score_snapshots_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `eco_score_snapshots` ADD CONSTRAINT `eco_score_snapshots_siteId_sites_id_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitoring_alerts` ADD CONSTRAINT `monitoring_alerts_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitoring_alerts` ADD CONSTRAINT `monitoring_alerts_anomalyId_anomaly_events_id_fk` FOREIGN KEY (`anomalyId`) REFERENCES `anomaly_events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitoring_alerts` ADD CONSTRAINT `monitoring_alerts_acknowledgedByUserId_users_id_fk` FOREIGN KEY (`acknowledgedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitoring_runs` ADD CONSTRAINT `monitoring_runs_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `anomaly_events_org_status_idx` ON `anomaly_events` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `anomaly_events_meter_detected_idx` ON `anomaly_events` (`meterId`,`detectedAt`);--> statement-breakpoint
CREATE INDEX `carbon_calculations_org_computed_idx` ON `carbon_calculations` (`organizationId`,`computedAt`);--> statement-breakpoint
CREATE INDEX `carbon_calculations_meter_idx` ON `carbon_calculations` (`meterId`);--> statement-breakpoint
CREATE INDEX `quality_findings_org_evaluated_idx` ON `data_quality_findings` (`organizationId`,`evaluatedAt`);--> statement-breakpoint
CREATE INDEX `quality_findings_meter_idx` ON `data_quality_findings` (`meterId`);--> statement-breakpoint
CREATE INDEX `eco_scores_org_computed_idx` ON `eco_score_snapshots` (`organizationId`,`computedAt`);--> statement-breakpoint
CREATE INDEX `eco_scores_site_computed_idx` ON `eco_score_snapshots` (`siteId`,`computedAt`);--> statement-breakpoint
CREATE INDEX `monitoring_alerts_org_status_idx` ON `monitoring_alerts` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `monitoring_runs_org_started_idx` ON `monitoring_runs` (`organizationId`,`startedAt`);