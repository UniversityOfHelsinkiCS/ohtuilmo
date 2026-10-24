import { test, expect } from '../test'
import { loginAs, loginAsAdmin } from '../helpers'

// a new student for every run, registrations can not be removed
const newStudent = () => {
  const studentNumber = '09' + Date.now().toString().slice(-7)
  return {
    headers: {
      uid: `student${studentNumber}`,
      givenname: 'Rekka',
      mail: '',
      hypersonstudentid: studentNumber,
      sn: 'Registrant' + studentNumber,
    },
  }
}

const register = async (page, student, email) => {
  await loginAs(page, student)
  await page.goto('register')

  await page.getByLabel('Vakuutan että esitiedot on suoritettu projektin alkuun mennessä').check()
  await page.locator('input[type=email]').fill(email)

  // answer the text questions of the registration, if there are any
  const answers = page.locator('textarea[placeholder="Answer"]:not([aria-hidden="true"])')
  for (const answer of await answers.all()) {
    await answer.fill('My answer')
  }

  await page
    .locator('label', { hasText: 'olen tutustunut projektin arvosteluperusteisiin' })
    .click()
  await page
    .locator('label', { hasText: 'sitoudun työskentelemään koko projektin ajan tasaisesti' })
    .click()
  // the same confirmation is asked also at the start of the form
  await page.locator('label', { hasText: 'Vakuutan että esitiedot on suoritettu' }).last().click()

  await page.locator('button', { hasText: 'Submit your registration' }).click()
  await expect(page.getByText('Registration submitted')).toBeVisible()
}

test.describe('Student registration', () => {
  test('a student can register to the project and sees the registration', async ({ page }) => {
    const student = newStudent()
    await register(page, student, 'rekka@example.com')

    await page.goto('register')
    await expect(page.getByText('You have already registered to current project.')).toBeVisible()

    await page.goto('registrationdetails')
    await expect(page.getByText('Rekka').first()).toBeVisible()
    await expect(page.getByText('rekka@example.com')).toBeVisible()
  })

  test('an admin sees the new registration', async ({ page }) => {
    const student = newStudent()
    await register(page, student, 'admin-sees@example.com')

    await loginAsAdmin(page)
    await page.goto('administration/registrations')
    await expect(page.getByText(student.headers.sn)).toBeVisible()
  })
})
