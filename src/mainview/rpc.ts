import { Electroview } from "electrobun/view";
import type { AppSchema } from "../shared/types";

export const rpc = Electroview.defineRPC<AppSchema>({
	handlers: {
		messages: {
			dbSaved: (payload: { dbPath: string | null; dbName: string }) => {
				console.log("[RPC] Message dbSaved:", payload.dbPath);
			},
			dbDirtyChanged: (payload: { isDirty: boolean }) => {
				console.log("[RPC] Message dbDirtyChanged:", payload.isDirty);
			}
		}
	}
});

// Initialize RPC transport
new Electroview({ rpc });
