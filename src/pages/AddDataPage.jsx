import BuildingAdder from '../components/BuildingAdder';
import AddReadingForm from '../components/AddReadingForm';
import CsvUploadPanel from '../components/CsvUploadPanel';

export default function AddDataPage({
  buildings,
  readings,
  onAddBuilding,
  onRemoveBuilding,
  onAddReading,
  onImportReadings,
}) {
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Add Data</h1>
          <p className="page-header__subtitle">
            Add buildings, enter a single reading, or upload a CSV file
          </p>
        </div>
      </header>

      <BuildingAdder
        buildings={buildings}
        readings={readings}
        onAddBuilding={onAddBuilding}
        onRemoveBuilding={onRemoveBuilding}
      />

      <section className="workspace-grid" aria-label="Add or import readings">
        <AddReadingForm
          buildings={buildings}
          readings={readings}
          onAddReading={onAddReading}
        />
        <CsvUploadPanel onImportReadings={onImportReadings} />
      </section>
    </>
  );
}
