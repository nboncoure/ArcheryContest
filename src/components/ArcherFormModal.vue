<script setup lang="ts">
import { ref, watch } from "vue";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";
import {
  AGE_CATEGORIES,
  BOW_TYPES,
  getAgeCategoryByCode,
  getBowTypeByCode,
  findCategoryCode,
} from "@/constants/staticData";
import type { Archer, AgeCategoryCode } from "@/types";

const props = defineProps<{
  isOpen: boolean;
  archer: Archer | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [archer: Partial<Archer>];
}>();

const selectedAgeGroup = ref<AgeCategoryCode>("S");

const archerForm = ref<Partial<Archer>>({
  lastName: "",
  firstName: "",
  club: "",
  departmentNumber: undefined,
  license: "",
  category: "",
  gender: "M",
  ageCategory: getAgeCategoryByCode("S"),
  bowType: getBowTypeByCode("AV"),
  isBeginner: false,
  isDisabled: false,
  isVisuallyImpaired: false,
});

watch(
  () => props.archer,
  (newArcher) => {
    if (newArcher) {
      archerForm.value = { ...newArcher };
      selectedAgeGroup.value = newArcher.ageCategory.code;
    } else {
      resetForm();
    }
  }
);

watch(
  [selectedAgeGroup, () => archerForm.value.bowType?.code, () => archerForm.value.gender],
  ([age, bowTypeCode, gender]) => {
    archerForm.value.category = findCategoryCode(age, bowTypeCode, gender);
    if (bowTypeCode) {
      archerForm.value.bowType = getBowTypeByCode(bowTypeCode);
    }
  },
  { immediate: true }
);

function resetForm() {
  archerForm.value = {
    lastName: "",
    firstName: "",
    club: "",
    departmentNumber: undefined,
    category: "",
    gender: "M",
    ageCategory: getAgeCategoryByCode("S"),
    bowType: getBowTypeByCode("AV"),
    license: "",
    isBeginner: false,
    isDisabled: false,
    isVisuallyImpaired: false,
  };
  selectedAgeGroup.value = "S";
}

function close() {
  resetForm();
  emit("close");
}

function save() {
  emit("save", archerForm.value);
  resetForm();
}
</script>

<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="close" class="relative z-10">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div
          class="flex items-center justify-center min-h-full p-4 text-center"
        >
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
            >
              <DialogTitle
                as="h3"
                class="mb-4 text-lg font-medium leading-6 text-gray-900"
              >
                {{ archer ? "Modifier" : "Ajouter" }} un archer
              </DialogTitle>

              <form @submit.prevent="save" class="space-y-4">
                <div class="form-group">
                  <label for="lastName">Nom</label>
                  <input
                    type="text"
                    id="lastName"
                    v-model="archerForm.lastName"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="firstName">Prénom</label>
                  <input
                    type="text"
                    id="firstName"
                    v-model="archerForm.firstName"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="club">Club</label>
                  <input
                    type="text"
                    id="club"
                    v-model="archerForm.club"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="departmentNumber">Numéro de département</label>
                  <input
                    type="number"
                    id="departmentNumber"
                    v-model="archerForm.departmentNumber"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="license">N° Licence</label>
                  <input
                    type="text"
                    id="license"
                    v-model="archerForm.license"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="ageGroup">Tranche d'âge</label>
                  <select id="ageGroup" v-model="selectedAgeGroup" required>
                    <option
                      v-for="ageCategory in AGE_CATEGORIES"
                      :key="ageCategory.code"
                      :value="ageCategory.code"
                    >
                      {{ ageCategory.label }} ({{ ageCategory.minAge }}-{{ ageCategory.maxAge }})
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="gender">Genre</label>
                  <select id="gender" v-model="archerForm.gender" required>
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="bowType">Type d'arc</label>
                  <select id="bowType" v-model="archerForm.bowType!.code" required>
                    <option
                      v-for="(bowType, key) in BOW_TYPES"
                      :key="key"
                      :value="bowType.code"
                    >
                      {{ bowType.label }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="mb-2">Particularités</label>
                  <div class="flex gap-3 mt-2">
                    <label
                      :class="[
                        archerForm.isBeginner ? 'bg-blue-50 border-blue-400' : 'border-gray-200',
                        'relative border rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer',
                      ]"
                    >
                      <input type="checkbox" v-model="archerForm.isBeginner" class="sr-only" />
                      <span :class="archerForm.isBeginner ? 'text-blue-700 font-medium' : 'text-gray-900'">Débutant</span>
                    </label>
                    <label
                      :class="[
                        archerForm.isVisuallyImpaired ? 'bg-purple-50 border-purple-400' : 'border-gray-200',
                        'relative border rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer',
                      ]"
                    >
                      <input type="checkbox" v-model="archerForm.isVisuallyImpaired" class="sr-only" />
                      <span :class="archerForm.isVisuallyImpaired ? 'text-purple-700 font-medium' : 'text-gray-900'">Malvoyant</span>
                    </label>
                  </div>
                </div>

                <div class="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    @click="close"
                    class="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button type="submit" class="btn btn-primary">
                    {{ archer ? "Modifier" : "Ajouter" }}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
