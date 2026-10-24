import { test, expect } from '../test'
import { deleteAllEmailTemplates, loginAsAdmin } from '../helpers'

const TEMPLATES = ['Topic proposal accepted', 'Topic proposal rejected', 'Customer review link']
const LANGUAGES = ['finnish', 'english']

const findTemplateTextarea = (page, templateTitle, templateLanguage) =>
  page.locator(
    `.email-template[data-cy-template="${templateTitle}"] .email-template__field--${templateLanguage} textarea:not([aria-hidden="true"])`,
  )

const writeToTemplate = (page, templateTitle, templateLanguage, text) =>
  findTemplateTextarea(page, templateTitle, templateLanguage).fill(text)

// waits for the save to finish so that the page is not reloaded too early
const clickSave = async (page) => {
  const saved = page.waitForResponse(
    (res) => res.url().includes('api/email/templates') && res.request().method() === 'POST',
  )
  await page.locator('.email-templates-form__submit-button').click()
  await saved
}

const visitEmailTemplatesPage = (page) => page.goto('administration/email-templates')

// checks that all the templates except the given one are empty
const expectOthersEmpty = async (page, exceptTitle, exceptLanguage) => {
  for (const title of TEMPLATES) {
    for (const language of LANGUAGES) {
      if (title === exceptTitle && language === exceptLanguage) continue
      await expect(findTemplateTextarea(page, title, language)).toHaveValue('')
    }
  }
}

const expectUpdatesOnly = async (page, templateTitle, templateLanguage, templateText) => {
  await writeToTemplate(page, templateTitle, templateLanguage, templateText)
  await clickSave(page)

  await visitEmailTemplatesPage(page)

  await expect(findTemplateTextarea(page, templateTitle, templateLanguage)).toHaveValue(
    templateText,
  )
  await expectOthersEmpty(page, templateTitle, templateLanguage)
}

test.describe('Email configuration page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await deleteAllEmailTemplates(page.request)
  })

  test.describe('updating templates', () => {
    test.beforeEach(async ({ page }) => {
      await visitEmailTemplatesPage(page)
    })

    test('shows empty fields when no configurations have been made', async ({ page }) => {
      await expectOthersEmpty(page, null, null)
    })

    test('updates only topic proposal accepted (finnish) successfully', async ({ page }) => {
      await expectUpdatesOnly(
        page,
        'Topic proposal accepted',
        'finnish',
        'Hei,\n\nProjekti "{{topicName}}" hyväksyttiin.',
      )
    })

    test('updates only topic proposal accepted (english) successfully', async ({ page }) => {
      await expectUpdatesOnly(
        page,
        'Topic proposal accepted',
        'english',
        'Hello,\n\nProject "{{topicName}}" was accepted.',
      )
    })

    test('updates only topic proposal rejected (finnish) successfully', async ({ page }) => {
      await expectUpdatesOnly(
        page,
        'Topic proposal rejected',
        'finnish',
        'Hei,\n\nProjektia "{{topicName}}" ei hyväksytty.',
      )
    })

    test('updates only topic proposal rejected (english) successfully', async ({ page }) => {
      await expectUpdatesOnly(
        page,
        'Topic proposal rejected',
        'english',
        'Hello,\n\nProject "{{topicName}}" was not accepted.',
      )
    })

    test('updates only customer review link (finnish) successfully', async ({ page }) => {
      await expectUpdatesOnly(
        page,
        'Customer review link',
        'finnish',
        'Hei, vastaathan loppuarviointiin osoitteessa {{secretLink}}',
      )
    })

    test('updates only customer review link (english) successfully', async ({ page }) => {
      await expectUpdatesOnly(
        page,
        'Customer review link',
        'english',
        'Hello, please answer the final review at {{secretLink}}',
      )
    })

    test('simultaneously updates all email templates successfully', async ({ page }) => {
      const texts = [
        ['Topic proposal accepted', 'finnish', 'Hei,\n\nProjekti "{{topicName}}" hyväksyttiin.'],
        ['Topic proposal accepted', 'english', 'Hello,\n\nProject "{{topicName}}" was accepted.'],
        ['Topic proposal rejected', 'finnish', 'Hei,\n\nProjektia "{{topicName}}" ei hyväksytty.'],
        [
          'Topic proposal rejected',
          'english',
          'Hello,\n\nProject "{{topicName}}" was not accepted.',
        ],
        [
          'Customer review link',
          'finnish',
          'Hei, vastaathan loppuarviointiin osoitteessa {{secretLink}}',
        ],
        [
          'Customer review link',
          'english',
          'Hello, please answer the final review at {{secretLink}}',
        ],
      ]

      for (const [templateTitle, templateLanguage, text] of texts) {
        await writeToTemplate(page, templateTitle, templateLanguage, text)
      }
      await clickSave(page)

      await visitEmailTemplatesPage(page)
      await expect(page.locator('h1')).toContainText('Configure email templates', {
        timeout: 15000,
      })
      for (const [templateTitle, templateLanguage, text] of texts) {
        await expect(findTemplateTextarea(page, templateTitle, templateLanguage)).toHaveValue(text)
      }
    })
  })
})
