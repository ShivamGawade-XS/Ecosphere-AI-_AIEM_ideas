CREATE TABLE `data_quality_rule_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`resourceType` enum('energy','water','waste','fuel','renewable') NOT NULL,
	`highValueCeiling` decimal(16,4) NOT NULL,
	`futureToleranceMinutes` int NOT NULL DEFAULT 5,
	`version` int NOT NULL DEFAULT 1,
	`updatedByUserId` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `data_quality_rule_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_quality_rules_org_resource_unique` UNIQUE(`organizationId`,`resourceType`)
);
--> statement-breakpoint
ALTER TABLE `data_quality_rule_profiles` ADD CONSTRAINT `data_quality_rule_profiles_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_quality_rule_profiles` ADD CONSTRAINT `data_quality_rule_profiles_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `data_quality_rules_org_updated_idx` ON `data_quality_rule_profiles` (`organizationId`,`updatedAt`);