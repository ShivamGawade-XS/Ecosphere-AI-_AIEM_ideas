ALTER TABLE `sustainability_actions` ADD `scenarioId` int;--> statement-breakpoint
ALTER TABLE `sustainability_actions` ADD CONSTRAINT `sa_scenario_fk` FOREIGN KEY (`scenarioId`) REFERENCES `sustainability_scenarios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sustainability_actions_scenario_idx` ON `sustainability_actions` (`scenarioId`);
