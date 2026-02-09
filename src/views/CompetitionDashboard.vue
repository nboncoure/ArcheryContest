<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competitionsStore";
import { storeToRefs } from "pinia";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";
import {
  CalendarIcon,
  MapPinIcon,
  ArrowsPointingOutIcon,
  PlayIcon,
  FlagIcon,
  UsersIcon,
  ArrowUpTrayIcon,
  ViewfinderCircleIcon,
  ChartBarIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  CheckBadgeIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/vue/24/outline";
import type { Competition } from "@/types";
import ConfirmModal from "@/components/ConfirmModal.vue";
import { useCompetitionStatus } from "@/composables/useCompetitionStatus";

const route = useRoute();
const competitionsStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionsStore);

const showEditModal = ref(false);
const form = ref<Partial<Competition>>({
  name: "",
  date: undefined,
  location: "",
  type: "indoor",
  numberOfTargets: 10,
});

const competition = computed(() =>
  competitions.value.find((c) => c.id === route.params.id)
);

const { canEditCompetitionInfo, isDraft, isActive, isCompleted } =
  useCompetitionStatus(competition);

const showReopenConfirm = ref(false);
const showRevertConfirm = ref(false);

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: "Brouillon",
    active: "En cours",
    completed: "Terminée",
  };
  return statusMap[status] || status;
}

function statusClass(status: string): string {
  const classes = {
    draft: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
  };
  return `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
    classes[status as keyof typeof classes]
  }`;
}

function isActiveRoute(name: string): boolean {
  return route.path.includes(`/${name}`);
}

function startCompetition() {
  if (competition.value) {
    competitionsStore.updateCompetition(competition.value.id, {
      status: "active",
    });
  }
}

function endCompetition() {
  if (competition.value) {
    competitionsStore.updateCompetition(competition.value.id, {
      status: "completed",
    });
  }
}

function reopenCompetition() {
  showReopenConfirm.value = false;
  if (competition.value) {
    competitionsStore.updateCompetition(competition.value.id, {
      status: "active",
    });
  }
}

function revertToDraft() {
  showRevertConfirm.value = false;
  if (competition.value) {
    competitionsStore.updateCompetition(competition.value.id, {
      status: "draft",
    });
  }
}

function openEditModal() {
  if (!canEditCompetitionInfo.value) return;
  if (competition.value) {
    form.value = {
      ...competition.value,
      flights: competition.value.flights.map((f) => ({ ...f })),
    };
    showEditModal.value = true;
  }
}

function closeEditModal() {
  showEditModal.value = false;
}

function saveCompetition() {
  if (competition.value) {
    competitionsStore.updateCompetition(competition.value.id, form.value);
    closeEditModal();
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50" v-if="competition">
    <header class="bg-white shadow">
      <div class="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900">
                {{ competition.name }}
              </h1>
              <button
                v-if="canEditCompetitionInfo"
                @click="openEditModal"
                class="text-gray-400 hover:text-gray-600"
              >
                <PencilIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="flex items-center gap-6 mt-2">
              <div class="flex items-center text-gray-600">
                <CalendarIcon class="w-5 h-5 mr-2" />
                {{ new Date(competition.date).toLocaleDateString() }}
              </div>
              <div class="flex items-center text-gray-600">
                <MapPinIcon class="w-5 h-5 mr-2" />
                {{ competition.location }}
              </div>
              <div class="flex items-center text-gray-600">
                <ArrowsPointingOutIcon class="w-5 h-5 mr-2" />
                {{ competition.type === "indoor" ? "Salle" : competition.type === "18m" ? "18m" : "Extérieur" }}
              </div>
              <div :class="statusClass(competition.status)">
                {{ translateStatus(competition.status) }}
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              v-if="isDraft"
              @click="startCompetition"
              class="btn btn-success"
            >
              <PlayIcon class="w-5 h-5" />
              Démarrer la compétition
            </button>
            <template v-else-if="isActive">
              <button
                @click="showRevertConfirm = true"
                class="btn btn-secondary"
              >
                <ArrowUturnLeftIcon class="w-5 h-5" />
                Revenir en préparation
              </button>
              <button
                @click="endCompetition"
                class="btn btn-danger"
              >
                <FlagIcon class="w-5 h-5" />
                Terminer la compétition
              </button>
            </template>
            <button
              v-else-if="isCompleted"
              @click="showReopenConfirm = true"
              class="btn btn-secondary"
            >
              <ArrowUturnLeftIcon class="w-5 h-5" />
              Réouvrir la compétition
            </button>
          </div>
        </div>
      </div>
    </header>

    <nav class="bg-white border-b border-gray-200">
      <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div class="flex justify-start h-16 gap-8">
          <router-link
            :to="`/competition/${competition.id}/archers`"
            class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 group"
            :class="[
              isActiveRoute('archers')
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            ]"
          >
            <UsersIcon class="w-5 h-5 mr-2" />
            Archers
          </router-link>

          <router-link
            :to="`/competition/${competition.id}/import`"
            class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 group"
            :class="[
              isActiveRoute('import')
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            ]"
          >
            <ArrowUpTrayIcon class="w-5 h-5 mr-2" />
            Import
          </router-link>

          <router-link
            :to="`/competition/${competition.id}/targets`"
            class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 group"
            :class="[
              isActiveRoute('targets')
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            ]"
          >
            <ViewfinderCircleIcon class="w-5 h-5 mr-2" />
            Cibles
          </router-link>

          <router-link
            :to="`/competition/${competition.id}/attendance`" 
            class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 group"
            :class="[
              isActiveRoute('attendance')
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            ]"
          > 

          <CheckBadgeIcon class="w-5 h-5 mr-2" /> 
            Présence
          </router-link>

          <router-link
            :to="`/competition/${competition.id}/scores`"
            class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 group"
            :class="[
              isActiveRoute('scores')
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            ]"
          >
            <ChartBarIcon class="w-5 h-5 mr-2" />
            Scores
          </router-link>

          <router-link
            :to="`/competition/${competition.id}/rankings`"
            class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 group"
            :class="[
              isActiveRoute('rankings')
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            ]"
          >
            <TrophyIcon class="w-5 h-5 mr-2" />
            Classements
          </router-link>
        </div>
      </div>
    </nav>

    <main class="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div class="px-4 sm:px-0">
        <router-view></router-view>
      </div>
    </main>

    <!-- Modal de modification -->
    <TransitionRoot appear :show="showEditModal" as="template">
      <Dialog as="div" @close="closeEditModal" class="relative z-10">
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
                  Modifier la compétition
                </DialogTitle>

                <form @submit.prevent="saveCompetition" class="space-y-4">
                  <div class="form-group">
                    <label for="name">Nom de la compétition</label>
                    <input type="text" id="name" v-model="form.name" required />
                  </div>

                  <div class="form-group">
                    <label for="date">Date</label>
                    <input type="date" id="date" v-model="form.date" required />
                  </div>

                  <div class="form-group">
                    <label for="location">Lieu</label>
                    <input
                      type="text"
                      id="location"
                      v-model="form.location"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="type">Type</label>
                    <select id="type" v-model="form.type" required>
                      <option value="indoor">Salle</option>
                      <option value="outdoor">Extérieur</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="numberOfSessions">Nombre de départs</label>
                    <input
                      type="number"
                      id="numberOfSessions"
                      v-model="form.numberOfSessions"
                      min="1"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="numberOfTargets">Nombre de cibles</label>
                    <input
                      type="number"
                      id="numberOfTargets"
                      v-model="form.numberOfTargets"
                      min="1"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="arbitratorName">Nom de l'arbitre</label>
                    <input
                      type="text"
                      id="arbitratorName"
                      v-model="form.arbitratorName"
                    />
                  </div>

                  <div
                    v-if="form.flights && form.flights.length > 0"
                    class="space-y-3"
                  >
                    <div
                      v-for="(flight, index) in form.flights"
                      :key="flight.id"
                      class="form-group"
                    >
                      <label :for="'edit-flight-' + index"
                        >Date et heure - {{ flight.name }}</label
                      >
                      <input
                        type="datetime-local"
                        :id="'edit-flight-' + index"
                        v-model="flight.startTime"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="organizingClub">Club organisateur</label>
                    <input
                      type="text"
                      id="organizingClub"
                      v-model="form.organizingClub"
                    />
                  </div>

                  <div class="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      @click="closeEditModal"
                      class="btn btn-secondary"
                    >
                      Annuler
                    </button>
                    <button type="submit" class="btn btn-primary">
                      Enregistrer
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <ConfirmModal
      :is-open="showReopenConfirm"
      title="Réouvrir la compétition"
      message="La compétition repassera en mode actif. Vous pourrez à nouveau modifier les présences et saisir des scores."
      confirm-label="Réouvrir"
      variant="warning"
      @close="showReopenConfirm = false"
      @confirm="reopenCompetition"
    />

    <ConfirmModal
      :is-open="showRevertConfirm"
      title="Revenir en préparation"
      message="La compétition repassera en mode brouillon. Vous pourrez à nouveau modifier les archers, cibles et affectations. Les présences et scores ne seront plus accessibles en saisie."
      confirm-label="Revenir en préparation"
      variant="warning"
      @close="showRevertConfirm = false"
      @confirm="revertToDraft"
    />
  </div>

  <div v-else class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="text-center">
      <ExclamationTriangleIcon class="w-12 h-12 mx-auto text-warning" />
      <h2 class="mt-2 text-lg font-semibold text-gray-900">
        Compétition non trouvée
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        La compétition que vous recherchez n'existe pas.
      </p>
      <div class="mt-6">
        <router-link to="/" class="btn btn-primary">
          Retour à l'accueil
        </router-link>
      </div>
    </div>
  </div>
</template>
