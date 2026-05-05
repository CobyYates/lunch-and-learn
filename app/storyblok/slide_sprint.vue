<script setup lang="ts">
interface SprintEvent {
  _uid: string;
  day_index: number | string;
  time_index: number | string;
  who?: string;
  title: string;
  kind?: "default" | "alt" | "muted" | "solid";
}

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    sprint_meta?: string;
    corner_label?: string;
    days?: string; // one per line: "Label|Number|isToday"
    times?: string; // one per line
    events?: SprintEvent[];
    repo_url?: string;
  };
}>();

interface Day {
  label: string;
  num: string;
  today: boolean;
}

const dayList = computed<Day[]>(() =>
  (props.blok.days ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, num, today] = line.split("|").map((s) => s.trim());
      return { label: label || "", num: num || "", today: (today || "").toLowerCase() === "true" };
    }),
);

const timeList = computed<string[]>(() =>
  (props.blok.times ?? "")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean),
);

function eventsAt(dayIdx: number, timeIdx: number): SprintEvent[] {
  return (props.blok.events ?? []).filter(
    (e) => Number(e.day_index) === dayIdx && Number(e.time_index) === timeIdx,
  );
}

function eventClass(kind?: string): string {
  if (kind === "alt") return "alt";
  if (kind === "muted") return "muted";
  if (kind === "solid") return "solid";
  return "";
}
</script>

<template>
  <div v-editable="blok" class="slide layout-sprint">
    <div class="slide-inner">
      <div class="head">
        <div>
          <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
          <h3 v-if="blok.title">{{ blok.title }}</h3>
        </div>
        <span v-if="blok.sprint_meta" class="sprint-meta" v-html="blok.sprint_meta" />
      </div>
      <div
        class="calendar"
        :style="`grid-template-columns: 5cqw repeat(${dayList.length || 5}, 1fr)`"
      >
        <div class="corner">{{ blok.corner_label || "PT" }}</div>
        <div
          v-for="(day, i) in dayList"
          :key="`day-${i}`"
          class="day-head"
          :class="{ today: day.today }"
        >
          <span>{{ day.label }}</span>
          <span class="num">{{ day.num }}</span>
        </div>

        <template v-for="(timeLabel, ti) in timeList" :key="`row-${ti}`">
          <div class="time-label">{{ timeLabel }}</div>
          <div
            v-for="(_, di) in dayList"
            :key="`cell-${ti}-${di}`"
            class="cell"
          >
            <div
              v-for="ev in eventsAt(di, ti)"
              :key="ev._uid"
              class="event"
              :class="eventClass(ev.kind)"
            >
              <span v-if="ev.who" class="who">{{ ev.who }}</span>
              {{ ev.title }}
            </div>
          </div>
        </template>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
  </div>
</template>
