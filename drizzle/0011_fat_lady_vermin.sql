ALTER TABLE `sustainability_actions` ADD `comparisonId` int;--> statement-breakpoint
ALTER TABLE `sustainability_actions` ADD CONSTRAINT `sa_comparison_fk` FOREIGN KEY (`comparisonId`) REFERENCES `intervention_comparisons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sustainability_actions_comparison_idx` ON `sustainability_actions` (`comparisonId`);
