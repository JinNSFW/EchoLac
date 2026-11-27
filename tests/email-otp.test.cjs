const test = require('node:test');
const assert = require('node:assert/strict');
const { app, ON, J } = require('./helpers/cloud.cjs');

// Adds the Supabase email OTP calls to the fake client; records calls without the code value.
function otpApp(verify = '{ data: { user: { id: "u1", email: "a@b.co" } }, error: null }') {
  const a = app(ON);
  a.run(`window.__otp = [];
    Object.assign(window.__supabaseForTest.auth, {
      updateUser: async a => { window.__otp.push(['updateUser', a]); return { error: null }; },
      signInWithOtp: async a => { window.__otp.push(['signInWithOtp', a]); return { error: null }; },
      verifyOtp: async a => { window.__otp.push(['verifyOtp', a.type, a.email]); return ${verify}; },
    });`);
  return a;
}

test('code input keeps digits only and accepts 6 to 10 of them', () => {
  const a = otpApp();
  assert.equal(a.run("otpDigits('12 34-56ab78')"), '12345678');
  assert.deepEqual(J(a, "['12345','123456','12345678','1234567890','12345678901'].map(validOtp)"), [false, true, true, true, false]);
  assert.equal(a.run("validEmail('a@b.co')"), true);
  assert.equal(a.run("validEmail('not-an-email')"), false);
});

test('linking keeps the anonymous account: updateUser, then an email_change code', async () => {
  const a = otpApp();
  await a.run("sendEmailCode('link', 'a@b.co')");
  assert.deepEqual(J(a, 'window.__otp[0]'), ['updateUser', { email: 'a@b.co' }]);
  await a.run("verifyEmailCode('link', 'a@b.co', '12345678')");
  assert.deepEqual(J(a, 'window.__otp[1]'), ['verifyOtp', 'email_change', 'a@b.co']);
  assert.equal(a.run('S.user.email'), 'a@b.co');
  assert.equal(a.run('cloudOwner()'), 'u1');
});

test('a wrong or expired code maps to a plain message and changes nothing', async () => {
  const a = otpApp('{ data: {}, error: { code: "otp_expired", status: 403 } }');
  await a.run("sendEmailCode('link', 'a@b.co')");
  const key = await a.run("verifyEmailCode('link', 'a@b.co', '00000000').then(() => 'ok', otpProblem)");
  assert.equal(key, 'code');
  assert.equal(a.run('S.user.email'), undefined);
  assert.equal(a.run("otpProblem({ status: 429 })"), 'rate');
  assert.equal(a.run("otpProblem({ code: 'over_email_send_rate_limit' })"), 'send');
});

test('sign-in on another device never creates an account', async () => {
  const a = otpApp();
  a.run('S.user = null');
  await a.run("sendEmailCode('signin', 'a@b.co')");
  const [name, args] = J(a, 'window.__otp[0]');
  assert.equal(name, 'signInWithOtp');
  assert.equal(args.email, 'a@b.co');
  assert.equal(args.options.shouldCreateUser, false);
  await a.run("verifyEmailCode('signin', 'a@b.co', '12345678')");
  assert.deepEqual(J(a, 'window.__otp[1]'), ['verifyOtp', 'email', 'a@b.co']);
  assert.equal(a.run('cloudOwner()'), 'u1');
});

test('resend waits for the cooldown', () => {
  const a = otpApp();
  a.run("Object.assign(OTP, { mode: 'link', step: 'code', email: 'a@b.co', until: Date.now() + 30000 }); otpSend(true)");
  assert.equal(a.run('OTP.msg'), 'wait');
  assert.equal(J(a, 'window.__otp').length, 0);
});
