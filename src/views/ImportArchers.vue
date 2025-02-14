<template>
  <div class="import-archers">
    <h1 class="mb-8 text-2xl font-bold text-gray-900">Import des Archers</h1>

    <div class="card">
      <div
        class="upload-zone"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="handleFileDrop"
        :class="{ 'drag-over': dragOver }"
      >
        <div class="text-center">
          <ArrowUpTrayIcon class="w-12 h-12 mx-auto text-gray-400" />
          <div class="mt-4">
            <label for="file-upload" class="cursor-pointer btn btn-primary">
              <DocumentArrowUpIcon class="w-5 h-5" />
              Sélectionner un fichier
            </label>
            <input
              id="file-upload"
              type="file"
              class="sr-only"
              @change="handleFileSelect"
              accept=".xlsx,.xls,.csv"
            />
          </div>
          <p class="mt-2 text-sm text-gray-600">
            ou déposez votre fichier Excel/CSV ici
          </p>
        </div>
      </div>

      <div v-if="importedArchers.length > 0" class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            Aperçu des données ({{ importedArchers.length }} archers)
          </h2>
          <div class="flex gap-3">
            <button @click="cancelImport" class="btn btn-secondary">
              <XMarkIcon class="w-5 h-5" />
              Annuler
            </button>
            <button @click="confirmImport" class="btn btn-primary">
              <CheckIcon class="w-5 h-5" />
              Confirmer l'import
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Nom
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Prénom
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Club
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Catégorie
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="archer in importedArchers.slice(0, 5)"
                :key="archer.id"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.lastName }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.firstName }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">{{ archer.club }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.category }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p
          v-if="importedArchers.length > 5"
          class="mt-4 text-sm text-center text-gray-600"
        >
          ... et {{ importedArchers.length - 5 }} autres archers
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionsStore } from "../stores/competitionsStore";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import type {
  Archer,
  ArcherBowType,
  ArcherPosition,
  ArcherAge,
  ArcherGender,
} from "../types";
import {
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/vue/24/outline";
import { getCategoryCode, translateAgeGroup } from "../constants/categories";
import {
  getBowTypeByCode,
  getAgeCategoryByCode,
  findCategoryCode,
} from "../constants/staticData";

const route = useRoute();
const competitionsStore = useCompetitionsStore();

const importedArchers = ref<Archer[]>([]);
const dragOver = ref(false);

function mapAgeGroup(age: string): ArcherAge | undefined {
  const ageGroupMap: Record<string, ArcherAge> = {
    "- de 11ans": "P",
    "11 / 12 ans": "B",
    "13 / 14 ans": "M",
    "15 / 16 ans": "C",
    "17 / 25 ans": "J",
    "26 / 49 ans": "S",
    "50 / 59 ans": "V",
    "60 et +": "SV",
  };
  return ageGroupMap[age] || undefined;
}

function translateBowType(bowType: string): string {
  const bowTypes: Record<string, string> = {
    SV: "Arc nue", // Sans viseur
    AV: "Classique", // Avec viseur
    COSV: "Poulie sans viseur", // Compound avec viseur
    COAV: "Poulie", // Compound avec viseur
  };
  return bowTypes[bowType] || bowType;
}

function parseTarget(
  targetStr: string
): { number: number; position: ArcherPosition } | undefined {
  if (!targetStr) return undefined;

  const match = targetStr.match(/(\d+)\s*([A-D])/);
  if (!match) return undefined;

  return {
    number: parseInt(match[1], 10),
    position: match[2] as ArcherPosition,
  };
}

function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  processFile(file);
}

function handleFileDrop(event: DragEvent) {
  dragOver.value = false;
  const file = event.dataTransfer?.files[0];
  if (!file) return;
  processFile(file);
}

function processFile(file: File) {
  if (file.name.endsWith(".csv")) {
    Papa.parse(file, {
      complete: (results) => {
        processImportedData(results.data);
      },
      header: true,
      encoding: "ISO-8859-1", // Pour gérer les caractères accentués
    });
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      processImportedData(jsonData);
    };
    reader.readAsBinaryString(file);
  }
}

function processImportedData(data: any[]) {
  importedArchers.value = data
    .map(
      (row: any): Partial<Archer> => ({
        id: row["N° Licence"] || uuidv4,
        lastName: row["NOM"] || "",
        firstName: row["Prénom"] || "",
        club: row["Club"] || "",
        birthYear: row["AnnÈe nais."]
          ? parseInt(row["AnnÈe nais."])
          : undefined,
        ageCategory: getAgeCategoryByCode(mapAgeGroup(row["Cat_age"])),
        gender:
          row["Sexe"] === "F" ? ("F" as ArcherGender) : ("M" as ArcherGender),
        bowType: getBowTypeByCode(row["Arme"]),
        license: row["N° Licence"] || "",
        isBeginner: row["Débutant"] === "D",
        isDisabled: row["Handicapè"] === "H",
        isVisuallyImpaired: row["Malvoyant"] === "M",
        session: row["N° Départ"] ? parseInt(row["N° Départ"]) : undefined,
        // target: parseTarget(row["Cible"]), // TODO: Gérer les cibles "01 A"
      })
    )
    .map((archer) => ({
      ...archer,
      category: findCategoryCode(
        archer.ageCategory?.code,
        archer.bowType?.code,
        archer.gender
      ),
    }));
}

function confirmImport() {
  if (importedArchers.value.length > 0) {
    competitionsStore.importArchers(
      route.params.id as string,
      importedArchers.value
    );
    importedArchers.value = [];
    alert("Import réussi !");
  }
}

function cancelImport() {
  importedArchers.value = [];
  (document.getElementById("file-upload") as HTMLInputElement).value = "";
}
</script>

<style scoped>
.import-archers {
  @apply max-w-7xl mx-auto p-6;
}

.upload-zone {
  @apply p-12 border-2 border-dashed border-gray-300 rounded-lg transition-colors duration-200;
}

.upload-zone.drag-over {
  @apply border-primary bg-blue-50;
}
</style>
