export async function openTools(page){
 const tools=page.locator('#phone-tools');
 if(!await tools.evaluate(el=>el.open))
  await tools.locator('summary').click();
}

export async function useTool(page,id){
 await openTools(page);
 await page.locator('#'+id).click();
}

export async function selectQuality(page,quality){
 await openTools(page);
 await page.locator('#graphics-quality').selectOption(quality);
 await page.locator('#phone-tools summary').click();
}
