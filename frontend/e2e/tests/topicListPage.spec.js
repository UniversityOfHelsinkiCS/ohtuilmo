import { test, expect } from '../test'
import { loginAsAdmin, deleteSentEmails, updateAllEmailTemplates } from '../helpers'

const topicListFilter = (page) => page.evaluate(() => window.store.getState().topicListPage.filter)

// the latest configuration is selected once the configurations have been loaded
const visitTopicsPage = async (page) => {
  await page.goto('topics')
  await expect.poll(() => topicListFilter(page)).not.toBe(0)
}

const selectFirstConfiguration = async (page) => {
  await page.locator('[data-cy="configurations-filter"]').click()
  await page.locator('[data-cy="configurations-1-"]').click()
}

const topicRow = (page, topicName) => page.locator(`[data-cy-topic-name="${topicName}"]`)

const findTopicActiveCheckbox = (page, topicName) =>
  topicRow(page, topicName).locator('[data-cy="toggle-active"] input')

const getSendAcceptButton = (page, topicName) =>
  topicRow(page, topicName).locator('[data-cy="send-accept-mail"]')

const getSendRejectButton = (page, topicName) =>
  topicRow(page, topicName).locator('[data-cy="send-reject-mail"]')

const getSendReviewLinkButton = (page, topicName) =>
  topicRow(page, topicName).locator('[data-cy="send-customer-review-link-email"]')

const clickSendAcceptEmail = (page, topicName) => getSendAcceptButton(page, topicName).click()

const clickSendRejectEmail = (page, topicName) => getSendRejectButton(page, topicName).click()

const clickSendReviewLinkEmail = (page, topicName) =>
  getSendReviewLinkButton(page, topicName).click()

/** @param {'finnish' | 'english'} language */
const clickEmailLanguage = (page, language) =>
  page
    .locator('[data-cy="email-language-menu"]')
    .locator(`[data-cy-send-mail-lang="${language}"]`)
    .click()

const topicRows = (page) => page.locator('tbody > *')

const expectEmailLanguageMenu = async (page) => {
  const menu = page.locator('[data-cy="email-language-menu"]')
  await expect(menu).toBeVisible()
  await expect(menu.locator('[data-cy-send-mail-lang="finnish"]')).toHaveCount(1)
  await expect(menu.locator('[data-cy-send-mail-lang="english"]')).toHaveCount(1)
}

const expectEmailSent = (page) => expect(page.locator('.notification')).toContainText('Email sent!')

test.describe('Topic list page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test.describe('configuration selector', () => {
    test.beforeEach(async ({ page }) => {
      await visitTopicsPage(page)
    })

    test('renders the configuration selector', async ({ page }) => {
      await expect(page.locator('[data-cy="configurations-filter"]')).toBeVisible()
    })

    test('renders option "All configurations"', async ({ page }) => {
      await page.locator('[data-cy="configurations-filter"]').click()
      await expect(page.getByRole('listbox').locator(':scope > *').nth(0)).toHaveText(
        'All configurations',
      )
    })

    test('renders all provided configuration options', async ({ page }) => {
      await page.locator('[data-cy="configurations-filter"]').click()
      const options = page.getByRole('listbox').locator(':scope > *')
      await expect(options.nth(1)).toBeVisible()
      await expect(options.nth(1)).toContainText('2024 Spring')
      await expect(options.nth(2)).toBeVisible()
      await expect(options.nth(2)).toContainText('2023 Autumn')
    })
  })

  test.describe('default configuration selected while loading Topics page', () => {
    test.beforeEach(async ({ page }) => {
      await visitTopicsPage(page)
    })

    test('after loading the topics page, latest configuration should be selected', async ({
      page,
    }) => {
      await expect.poll(() => topicListFilter(page)).toBe(5)
    })

    test('after loading the topics page, message should be rendered without topics', async ({
      page,
    }) => {
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('h1')).toHaveText('None available')
    })
  })

  test.describe('topics', () => {
    const toggleTestTopicName = 'Aihe C'

    test.beforeEach(async ({ page }) => {
      await visitTopicsPage(page)
      await selectFirstConfiguration(page)
    })

    test('renders the topic names correctly', async ({ page }) => {
      const topicTitles = ['Aihe A', 'Aihe B']

      for (const topicTitle of topicTitles) {
        await expect(
          topicRow(page, topicTitle).locator('.topic-table-row__topic-title'),
        ).toHaveText(topicTitle)
      }
    })

    test('renders the customer names and emails correctly', async ({ page }) => {
      const customer = topicRow(page, 'Aihe A').locator('.topic-table-row__customer')
      await expect(customer).toContainText('Aasiakas')
      await expect(customer).toContainText('aasia@kas')
    })

    test('toggles topic active state correctly', async ({ page }) => {
      const checkbox = findTopicActiveCheckbox(page, toggleTestTopicName)
      // get initial checked state
      await expect(checkbox).toBeAttached()
      const desiredState = !(await checkbox.isChecked())

      // toggle active
      await checkbox.click()

      // did it change state?
      await expect(checkbox).toBeChecked({ checked: desiredState })

      await visitTopicsPage(page)
      await selectFirstConfiguration(page)

      // still in correct state after refresh?
      await expect(findTopicActiveCheckbox(page, toggleTestTopicName)).toBeChecked({
        checked: desiredState,
      })
    })

    test('renders correct number of topics', async ({ page }) => {
      await expect(topicRows(page)).toHaveCount(5)
    })

    test('renders topics in correct order', async ({ page }) => {
      const rows = topicRows(page)
      await expect(rows.nth(0)).toHaveAttribute('data-cy-topic-name', 'Aihe A')
      await expect(rows.nth(1)).toHaveAttribute('data-cy-topic-name', 'Aihe B')
      await expect(rows.nth(2)).toHaveAttribute(
        'data-cy-topic-name',
        'Ohjelmistotuotantoprojektin laajennus',
      )

      // Restore Aihe C to its original Active state to prevent test pollution in subsequent runs!
      await findTopicActiveCheckbox(page, 'Aihe C').click()
    })
  })

  test.describe('emails', () => {
    // from seed "page-access-seeds"
    const topicName = 'Aihe A'
    const topicSecretId = 'eec0neeT0jo0ae9F'
    const secretReviewLink = `https://study.cs.helsinki.fi/projekti/customer-review/${topicSecretId}`

    // messages of the confirm dialogs, for the email preview tests
    let confirms

    test.beforeEach(async ({ page }) => {
      await deleteSentEmails(page.request)
      await updateAllEmailTemplates(page.request, {
        topicAccepted: {
          finnish: 'Projekti {{topicName}} hyväksytty.',
          english: 'Project {{topicName}} was accepted.',
        },
        topicRejected: {
          finnish: 'Projekti {{topicName}} hylätty.',
          english: 'Project {{topicName}} was rejected.',
        },
        customerReviewLink: {
          finnish: 'Arviointi on nyt auki projektille {{topicName}} osoitteessa {{secretLink}}',
          english: 'Review is now open for project {{topicName}}, go to {{secretLink}}',
        },
      })

      confirms = []
      page.removeAllListeners('dialog')
      page.on('dialog', (dialog) => {
        if (dialog.type() === 'confirm') confirms.push(dialog.message())
        dialog.accept()
      })

      await visitTopicsPage(page)
      await selectFirstConfiguration(page)
    })

    const expectConfirm = async (text) => {
      await expect.poll(() => confirms.length).toBe(1)
      expect(confirms[0]).toContain(text)
    }

    test('shows email languages after clicking accept', async ({ page }) => {
      await clickSendAcceptEmail(page, topicName)
      await expectEmailLanguageMenu(page)
    })

    test('shows email languages after clicking reject', async ({ page }) => {
      await clickSendRejectEmail(page, topicName)
      await expectEmailLanguageMenu(page)
    })

    test('shows email languages after clicking send customer review link', async ({ page }) => {
      await clickSendReviewLinkEmail(page, topicName)
      await expectEmailLanguageMenu(page)
    })

    test('shows a success popup after sending an email', async ({ page }) => {
      await clickSendAcceptEmail(page, topicName)
      await clickEmailLanguage(page, 'finnish')

      await expectEmailSent(page)
    })

    test('shows a success popup after re-sending an email', async ({ page }) => {
      await clickSendAcceptEmail(page, topicName)
      await clickEmailLanguage(page, 'finnish')
      await expectEmailSent(page)

      await clickSendAcceptEmail(page, topicName)
      await clickEmailLanguage(page, 'finnish')
      await expectEmailSent(page)
    })

    test.describe('accept/reject buttons', () => {
      test('changes accept button text to "resend accept" after sending', async ({ page }) => {
        await expect(getSendAcceptButton(page, topicName)).toHaveText('Accept')

        await clickSendAcceptEmail(page, topicName)
        await clickEmailLanguage(page, 'finnish')

        await expect(getSendAcceptButton(page, topicName)).toHaveText('Resend Accept')
      })

      test('changes reject button text to "resend reject" after sending', async ({ page }) => {
        await expect(getSendRejectButton(page, topicName)).toHaveText('Reject')

        await clickSendRejectEmail(page, topicName)
        await clickEmailLanguage(page, 'finnish')

        await expect(getSendRejectButton(page, topicName)).toHaveText('Resend Reject')
      })

      test('does not change the buttons of another topic after sending accept and reject', async ({
        page,
      }) => {
        await expect(getSendAcceptButton(page, 'Aihe B')).toHaveText('Accept')
        await expect(getSendRejectButton(page, 'Aihe B')).toHaveText('Reject')

        await clickSendAcceptEmail(page, 'Aihe A')
        await clickEmailLanguage(page, 'english')
        await clickSendRejectEmail(page, 'Aihe A')
        await clickEmailLanguage(page, 'english')

        await expect(getSendAcceptButton(page, 'Aihe B')).toHaveText('Accept')
        await expect(getSendRejectButton(page, 'Aihe B')).toHaveText('Reject')
      })
    })

    test.describe('filtering by acceptance status', () => {
      test('shows all topics after setting the filter to "All"', async ({ page }) => {
        await page.locator('[data-cy="acceptance-filter-all"]').click()
        await expect(topicRows(page)).toHaveCount(5)
      })

      test('shows message if no topics are found after filtering', async ({ page }) => {
        await expect(topicRows(page)).toHaveCount(5)
        await page.locator('[data-cy="acceptance-filter-rejected"]').click()
        await expect(page.locator('h1')).toBeVisible()
        await expect(page.locator('h1')).toHaveText('None available')
        await page.locator('[data-cy="acceptance-filter-accepted"]').click()
        await expect(page.locator('h1')).toBeVisible()
        await expect(page.locator('h1')).toHaveText('None available')
      })

      test('shows only accepted topics after filtering', async ({ page }) => {
        await clickSendAcceptEmail(page, 'Aihe A')
        await clickEmailLanguage(page, 'finnish')
        await expect(getSendAcceptButton(page, 'Aihe A')).toHaveText('Resend Accept')
        await page.locator('[data-cy="acceptance-filter-accepted"]').click()
        await expect(topicRows(page)).toHaveCount(1)
      })

      test('shows only rejected topics after filtering', async ({ page }) => {
        await clickSendRejectEmail(page, 'Aihe B')
        await clickEmailLanguage(page, 'finnish')
        await expect(getSendRejectButton(page, 'Aihe B')).toHaveText('Resend Reject')
        await page.locator('[data-cy="acceptance-filter-rejected"]').click()
        await expect(topicRows(page)).toHaveCount(1)
      })
    })

    test.describe('customer review button', () => {
      test('changes send link text to send reminder after sending', async ({ page }) => {
        await expect(getSendReviewLinkButton(page, topicName)).toHaveText('Send link')

        await clickSendReviewLinkEmail(page, topicName)
        await clickEmailLanguage(page, 'finnish')

        await expect(getSendReviewLinkButton(page, topicName)).toHaveText('Send reminder')
      })

      test('does not change the buttons of another topic after sending link', async ({ page }) => {
        await expect(getSendReviewLinkButton(page, 'Aihe B')).toHaveText('Send link')

        await clickSendReviewLinkEmail(page, 'Aihe A')
        await clickEmailLanguage(page, 'english')

        await expect(getSendReviewLinkButton(page, 'Aihe B')).toHaveText('Send link')
      })
    })

    test.describe('email preview', () => {
      test('shows the correctly rendered email confirm for topic accepted (finnish) template', async ({
        page,
      }) => {
        await clickSendAcceptEmail(page, topicName)
        await clickEmailLanguage(page, 'finnish')
        await expectConfirm(`Projekti ${topicName} hyväksytty.`)
      })

      test('shows the correctly rendered email confirm for topic accepted (english) template', async ({
        page,
      }) => {
        await clickSendAcceptEmail(page, topicName)
        await clickEmailLanguage(page, 'english')
        await expectConfirm(`Project ${topicName} was accepted.`)
      })

      test('shows the correctly rendered email confirm for topic rejected (finnish) template', async ({
        page,
      }) => {
        await clickSendRejectEmail(page, topicName)
        await clickEmailLanguage(page, 'finnish')
        await expectConfirm(`Projekti ${topicName} hylätty.`)
      })

      test('shows the correctly rendered email confirm for topic rejected (english) template', async ({
        page,
      }) => {
        await clickSendRejectEmail(page, topicName)
        await clickEmailLanguage(page, 'english')
        await expectConfirm(`Project ${topicName} was rejected.`)
      })

      test('shows the correctly rendered email confirm for customer review link (finnish)', async ({
        page,
      }) => {
        await clickSendReviewLinkEmail(page, topicName)
        await clickEmailLanguage(page, 'finnish')
        await expectConfirm(
          `Arviointi on nyt auki projektille ${topicName} osoitteessa ${secretReviewLink}`,
        )
      })

      test('shows the correctly rendered email confirm for customer review link (english)', async ({
        page,
      }) => {
        await clickSendReviewLinkEmail(page, topicName)
        await clickEmailLanguage(page, 'english')
        await expectConfirm(
          `Review is now open for project ${topicName}, go to ${secretReviewLink}`,
        )
      })
    })
  })
})
