// Example usage of the photo store - easily swappable storage solution
// This demonstrates how photos are stored in memory and can be easily replaced

import { usePhotoStore } from "@/lib/photoStore";

export const PhotoStoreDemo = () => {
	const {
		facePhotos,
		bodyMeasurements,
		getFacePhoto,
		clearFacePhotos,
		reset,
		getAllData,
	} = usePhotoStore();

	const handleExportData = () => {
		const allData = getAllData();
		console.log("All stored data:", allData);

		// Example: Export as JSON
		const dataStr = JSON.stringify(allData, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement("a");
		link.href = url;
		link.download = "photo-store-data.json";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	return (
		<div className="p-4 border rounded-lg bg-muted/50">
			<h3 className="font-semibold mb-2">Photo Store Status</h3>
			<p className="text-sm text-muted-foreground mb-4">
				Photos stored in memory using Zustand - easily swappable with
				localStorage, IndexedDB, or any other storage solution.
			</p>

			<div className="space-y-2 text-sm">
				<p>
					<strong>Face Photos:</strong> {facePhotos.length} stored
				</p>
				<p>
					<strong>Body Measurements:</strong>{" "}
					{bodyMeasurements ? "Saved" : "Not set"}
				</p>
				<p>
					<strong>Storage Type:</strong> In-Memory (Zustand)
				</p>
			</div>

			<div className="flex gap-2 mt-4">
				<button
					onClick={handleExportData}
					className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
				>
					Export Data
				</button>
				<button
					onClick={clearFacePhotos}
					className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
				>
					Clear Photos
				</button>
				<button
					onClick={reset}
					className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm"
				>
					Reset All
				</button>
			</div>

			{/* Display stored photos */}
			{facePhotos.length > 0 && (
				<div className="mt-4">
					<h4 className="font-medium mb-2">Stored Photos:</h4>
					<div className="grid grid-cols-2 gap-2">
						{facePhotos.map((photo) => (
							<div key={photo.id} className="border rounded p-2">
								<img
									src={photo.url}
									alt={`${photo.angle} photo`}
									className="w-full h-20 object-cover rounded mb-1"
								/>
								<p className="text-xs">
									{photo.angle} - {photo.quality}
								</p>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

// Example of how to swap storage solutions:
// 1. For localStorage: Use zustand/middleware with persist
// 2. For IndexedDB: Create custom middleware
// 3. For server storage: Add API calls in store actions
// 4. For file system: Use Tauri or Electron APIs

export default PhotoStoreDemo;
