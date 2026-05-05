<script setup lang="ts">
interface KanbanCard {
  _uid: string;
  tag_kind?: "feat" | "bug" | "chore";
  tag_label?: string;
  title: string;
  ticket?: string;
  assignee_initials?: string;
}

interface KanbanColumn {
  _uid: string;
  kind?: "todo" | "doing" | "review" | "done";
  title?: string;
  count_label?: string;
  cards?: KanbanCard[];
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    meta_label?: string;
    columns?: KanbanColumn[];
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-kanban">
    <div class="slide-inner">
      <div class="head">
        <div>
          <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
          <h3 v-if="blok.title">{{ blok.title }}</h3>
        </div>
        <span v-if="blok.meta_label" class="meta">{{ blok.meta_label }}</span>
      </div>
      <div
        class="board"
        :style="`grid-template-columns: repeat(${(blok.columns ?? []).length || 4}, 1fr)`"
      >
        <div
          v-for="col in blok.columns ?? []"
          :key="col._uid"
          class="col"
          :class="col.kind || 'todo'"
        >
          <div class="col-head">
            <h5>{{ col.title }}</h5>
            <span v-if="col.count_label" class="count">{{ col.count_label }}</span>
          </div>
          <div
            v-for="card in col.cards ?? []"
            :key="card._uid"
            class="card"
          >
            <span v-if="card.tag_label" class="tag" :class="card.tag_kind || 'feat'">
              {{ card.tag_label }}
            </span>
            <h6>{{ card.title }}</h6>
            <div class="footer">
              <span v-if="card.ticket" class="ticket">{{ card.ticket }}</span>
              <span v-if="card.assignee_initials" class="av">{{ card.assignee_initials }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
  </div>
</template>
