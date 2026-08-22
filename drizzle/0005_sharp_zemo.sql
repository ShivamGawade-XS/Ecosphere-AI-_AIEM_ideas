CREATE TABLE `data_import_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`ingestionBatchId` int,
	`fileName` varchar(255) NOT NULL,
	`contentType` varchar(128) NOT NULL DEFAULT 'text/csv',
	`storageKey` varchar(512) NOT NULL,
	`contentHash` varchar(128) NOT NULL,
	`idempotencyKey` varchar(160) NOT NULL,
	`byteSize` int NOT NULL,
	`status` enum('uploaded','previewed','committed','completed_with_errors','failed') NOT NULL DEFAULT 'uploaded',
	`totalRows` int NOT NULL DEFAULT 0,
	`validRows` int NOT NULL DEFAULT 0,
	`rejectedRows` int NOT NULL DEFAULT 0,
	`errorSummary` text,
	`previewedAt` timestamp,
	`committedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `data_import_files_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_import_files_org_key_unique` UNIQUE(`organizationId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `data_import_rows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importFileId` int NOT NULL,
	`organizationId` int NOT NULL,
	`rowNumber` int NOT NULL,
	`rawRecord` json NOT NULL,
	`meterKey` varchar(96),
	`observedAt` timestamp,
	`value` decimal(16,4),
	`unit` varchar(24),
	`status` enum('valid','rejected','imported') NOT NULL,
	`validationErrors` json,
	`readingId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `data_import_rows_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_import_rows_file_number_unique` UNIQUE(`importFileId`,`rowNumber`)
);
--> statement-breakpoint
CREATE TABLE `emission_factors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`resourceType` enum('energy','water','waste','fuel','renewable') NOT NULL,
	`inputUnit` varchar(24) NOT NULL,
	`emittedKgCo2ePerUnit` decimal(16,8) NOT NULL,
	`scope` varchar(48) NOT NULL,
	`geography` varchar(160) NOT NULL,
	`methodology` varchar(240) NOT NULL,
	`sourceName` varchar(240) NOT NULL,
	`sourceUrl` varchar(512),
	`factorVersion` varchar(64) NOT NULL,
	`validFrom` timestamp NOT NULL,
	`validTo` timestamp,
	`status` enum('draft','approved','archived') NOT NULL DEFAULT 'draft',
	`createdByUserId` int NOT NULL,
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emission_factors_id` PRIMARY KEY(`id`),
	CONSTRAINT `emission_factors_org_version_unique` UNIQUE(`organizationId`,`factorVersion`)
);
--> statement-breakpoint
CREATE TABLE `reading_corrections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`originalReadingId` int NOT NULL,
	`correctedReadingId` int,
	`status` enum('approved','rejected') NOT NULL DEFAULT 'approved',
	`reason` varchar(500) NOT NULL,
	`submittedByUserId` int NOT NULL,
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reading_corrections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sustainability_readings` ADD `supersededAt` timestamp;--> statement-breakpoint
ALTER TABLE `data_import_files` ADD CONSTRAINT `data_import_files_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_import_files` ADD CONSTRAINT `data_import_files_uploadedByUserId_users_id_fk` FOREIGN KEY (`uploadedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_import_files` ADD CONSTRAINT `data_import_files_ingestionBatchId_ingestion_batches_id_fk` FOREIGN KEY (`ingestionBatchId`) REFERENCES `ingestion_batches`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_import_rows` ADD CONSTRAINT `data_import_rows_importFileId_data_import_files_id_fk` FOREIGN KEY (`importFileId`) REFERENCES `data_import_files`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_import_rows` ADD CONSTRAINT `data_import_rows_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_import_rows` ADD CONSTRAINT `data_import_rows_readingId_sustainability_readings_id_fk` FOREIGN KEY (`readingId`) REFERENCES `sustainability_readings`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emission_factors` ADD CONSTRAINT `emission_factors_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emission_factors` ADD CONSTRAINT `emission_factors_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emission_factors` ADD CONSTRAINT `emission_factors_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_corrections` ADD CONSTRAINT `reading_corrections_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_corrections` ADD CONSTRAINT `rc_original_reading_fk` FOREIGN KEY (`originalReadingId`) REFERENCES `sustainability_readings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_corrections` ADD CONSTRAINT `rc_corrected_reading_fk` FOREIGN KEY (`correctedReadingId`) REFERENCES `sustainability_readings`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_corrections` ADD CONSTRAINT `rc_submitted_user_fk` FOREIGN KEY (`submittedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_corrections` ADD CONSTRAINT `rc_approved_user_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `data_import_files_org_created_idx` ON `data_import_files` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `data_import_files_batch_idx` ON `data_import_files` (`ingestionBatchId`);--> statement-breakpoint
CREATE INDEX `data_import_rows_org_status_idx` ON `data_import_rows` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `data_import_rows_reading_idx` ON `data_import_rows` (`readingId`);--> statement-breakpoint
CREATE INDEX `emission_factors_org_status_idx` ON `emission_factors` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `emission_factors_lookup_idx` ON `emission_factors` (`organizationId`,`resourceType`,`inputUnit`,`status`,`validFrom`);--> statement-breakpoint
CREATE INDEX `reading_corrections_org_created_idx` ON `reading_corrections` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `reading_corrections_original_idx` ON `reading_corrections` (`originalReadingId`);--> statement-breakpoint
CREATE INDEX `reading_corrections_corrected_idx` ON `reading_corrections` (`correctedReadingId`);
