import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("mostra 5 estações e 4 tópicos no módulo inicial", async ({ page }) => {
  await expect(page.locator(".stop")).toHaveCount(5);
  await expect(page.locator(".topic")).toHaveCount(4);
});

test("abas respondem a seta e a End", async ({ page }) => {
  const topic = page.locator(".topic").first();
  await topic.getByRole("tab").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(topic.getByRole("tab", { name: "Prática" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(topic.getByRole("tab", { name: "Fixar" })).toHaveAttribute("aria-selected", "true");
});

test("busca encontra tópico por ferramenta", async ({ page }) => {
  await page.getByLabel("Buscar").fill("docker");
  await expect(page.getByRole("heading", { level: 3, name: "IaC e containers" })).toBeVisible();
});

test("progresso persiste após recarregar", async ({ page }) => {
  await page.getByRole("button", { name: "Marcar como concluído" }).first().click();
  await expect(page.locator("#count")).toHaveText("1 de 20 tópicos");
  await page.reload();
  await expect(page.locator("#count")).toHaveText("1 de 20 tópicos");
});

test("flashcard vira e avança no baralho", async ({ page }) => {
  const topic = page.locator(".topic").first();
  await topic.getByRole("tab", { name: "Fixar" }).click();
  const card = topic.locator(".flash");
  const question = await card.textContent();
  await card.click();
  await expect(card).not.toHaveText(question);
  await topic.getByRole("button", { name: "Próximo" }).click();
  await expect(topic.locator(".counter")).toHaveText("2 de 7");
});

test("preferências aumentam o tamanho do texto", async ({ page }) => {
  await page.getByRole("button", { name: "Preferências" }).click();
  await page.getByLabel("Tamanho do texto").fill("130");
  const size = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  expect(size).toBe("20.8px");
});

test("sem violações de acessibilidade WCAG A e AA", async ({ page }) => {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(violations).toEqual([]);
});
