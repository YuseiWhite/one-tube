import { deployCommand } from "./commands/deploy";
import { seedCommand } from "./commands/seed";
import { updateSharedVersionsCommand } from "./commands/update-shared-versions";
import { getErrorMessage, getErrorStack, resolveNetwork } from "./shared/utils";

/**
 * CLIのメインエントリーポイント
 * deploy/seedコマンドを実行
 */
async function main(): Promise<void> {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error("Usage: tsx scripts/tool.ts <command> --network <network>");
		console.error("");
		console.error("Commands:");
		console.error("  deploy            - Deploy contract to Sui network");
		console.error("  seed              - Seed NFTs to Kiosk");
		console.error(
			"  update-versions   - Update shared object versions in .env",
		);
		console.error("");
		console.error("Options:");
		console.error(
			"  --network <network>  - Network to use (devnet, testnet, mainnet, localnet)",
		);
		console.error("");
		console.error("Examples:");
		console.error("  tsx scripts/tool.ts deploy --network devnet");
		console.error("  tsx scripts/tool.ts seed --network devnet");
		console.error("  tsx scripts/tool.ts update-versions --network devnet");
		process.exit(1);
	}

	const command = args[0];
	const networkIndex = args.indexOf("--network");
	const networkArg = networkIndex >= 0 ? args[networkIndex + 1] : undefined;
	const network = resolveNetwork(networkArg);

	try {
		switch (command) {
			case "deploy":
				await deployCommand(network);
				break;
			case "seed":
				await seedCommand(network);
				break;
			case "update-versions":
				await updateSharedVersionsCommand(network);
				break;
			default:
				console.error(`Unknown command: ${command}`);
				console.error("Valid commands: deploy, seed, update-versions");
				process.exit(1);
		}
	} catch (error: unknown) {
		console.error("\n❌ Error:");
		console.error(getErrorMessage(error));
		const stack = getErrorStack(error);
		if (stack) {
			console.error("\nStack trace:");
			console.error(stack);
		}
		process.exit(1);
	}
}

// main関数を実行
main().catch((error) => {
	console.error("Fatal error:", getErrorMessage(error));
	const stack = getErrorStack(error);
	if (stack) {
		console.error(stack);
	}
	process.exit(1);
});
