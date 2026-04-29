const modules = import.meta.glob("./*.json", { eager: true });

export const levels = Object.values(modules)
  .map((module) => module.default)
  .sort((a, b) => a.number - b.number);
