import type { QueueItRunOptions, QueueItTryPassResult } from '../index';

jest.mock('react-native', () => ({
  NativeModules: {},
  Platform: { OS: 'ios' },
}));

jest.mock('../specs/NativeQueueIt', () => ({
  __esModule: true,
  default: {
    runAsync: jest.fn(),
    runWithEnqueueTokenAsync: jest.fn(),
    runWithEnqueueKeyAsync: jest.fn(),
    tryPassAsync: jest.fn(),
    tryPassWithEnqueueTokenAsync: jest.fn(),
    tryPassWithEnqueueKeyAsync: jest.fn(),
    showQueueAsync: jest.fn(),
    onWebViewEvent: jest.fn(),
  },
}));

const { QueueIt, TryPassState } =
  require('../index') as typeof import('../index');
const nativeQueueIt = require('../specs/NativeQueueIt').default as {
  runAsync: jest.Mock;
  runWithEnqueueTokenAsync: jest.Mock;
  runWithEnqueueKeyAsync: jest.Mock;
  tryPassAsync: jest.Mock;
  tryPassWithEnqueueTokenAsync: jest.Mock;
  tryPassWithEnqueueKeyAsync: jest.Mock;
  showQueueAsync: jest.Mock;
  onWebViewEvent: jest.Mock;
};

type RunCall = (
  layoutName?: string,
  language?: string,
  options?: QueueItRunOptions
) => Promise<unknown>;

const runMethods: [string, () => jest.Mock, RunCall, string[]][] = [
  [
    'run',
    () => nativeQueueIt.runAsync,
    (layoutName, language, options) =>
      QueueIt.run('customer', 'event', layoutName, language, options),
    ['customer', 'event'],
  ],
  [
    'runWithEnqueueToken',
    () => nativeQueueIt.runWithEnqueueTokenAsync,
    (layoutName, language, options) =>
      QueueIt.runWithEnqueueToken(
        'customer',
        'event',
        'token',
        layoutName,
        language,
        options
      ),
    ['customer', 'event', 'token'],
  ],
  [
    'runWithEnqueueKey',
    () => nativeQueueIt.runWithEnqueueKeyAsync,
    (layoutName, language, options) =>
      QueueIt.runWithEnqueueKey(
        'customer',
        'event',
        'key',
        layoutName,
        language,
        options
      ),
    ['customer', 'event', 'key'],
  ],
];

const passMethods: [string, () => jest.Mock, RunCall, string[]][] = [
  [
    'tryPass',
    () => nativeQueueIt.tryPassAsync,
    (layoutName, language, options) =>
      QueueIt.tryPass('customer', 'event', layoutName, language, options),
    ['customer', 'event'],
  ],
  [
    'tryPassWithEnqueueToken',
    () => nativeQueueIt.tryPassWithEnqueueTokenAsync,
    (layoutName, language, options) =>
      QueueIt.tryPassWithEnqueueToken(
        'customer',
        'event',
        'token',
        layoutName,
        language,
        options
      ),
    ['customer', 'event', 'token'],
  ],
  [
    'tryPassWithEnqueueKey',
    () => nativeQueueIt.tryPassWithEnqueueKeyAsync,
    (layoutName, language, options) =>
      QueueIt.tryPassWithEnqueueKey(
        'customer',
        'event',
        'key',
        layoutName,
        language,
        options
      ),
    ['customer', 'event', 'key'],
  ],
];

const nativeMethods = [...runMethods, ...passMethods];

const nativePassCheckResult = {
  queueittoken: 'ptoken',
  queueUrl: 'https://q.example/queue',
  targetUrl: 'https://t.example/target',
  urlTTLInMinutes: 5,
  redirectType: 'queue',
};

const noResultMessage = 'The pass check ended without a result';

const listenedEvents = ['openingQueueView', 'webViewClosed', 'queueUrlChanged'];

type WebViewCallback = (event: { name: string }) => void;

function registerOnAndOnce(
  engine: typeof QueueIt,
  eventTypes: string[]
): () => number[] {
  const listeners = eventTypes.flatMap((eventType) => {
    const onListener = jest.fn();
    const onceListener = jest.fn();
    engine.on(eventType, onListener);
    engine.once(eventType, onceListener);
    return [onListener, onceListener];
  });
  return () => listeners.map((listener) => listener.mock.calls.length);
}

const subsOf = (engine: typeof QueueIt) =>
  (engine as unknown as { subs: unknown[] }).subs;

function subscribeThroughOnAndOnce(eventTypes: string[]) {
  const callbacks = new Set<WebViewCallback>();
  const nativeRemove = jest.fn();
  nativeQueueIt.onWebViewEvent.mockImplementation(
    (callback: WebViewCallback) => {
      callbacks.add(callback);
      return {
        remove: () => {
          nativeRemove();
          callbacks.delete(callback);
        },
      };
    }
  );
  return {
    nativeRemove,
    emit: (...emitted: string[]) =>
      emitted.forEach((eventType) =>
        [...callbacks].forEach((callback) => callback({ name: eventType }))
      ),
    callCounts: registerOnAndOnce(QueueIt, eventTypes),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  for (const [, nativeMethod] of runMethods) {
    nativeMethod().mockResolvedValue({
      queueittoken: 'qtoken',
      state: 'Passed',
    });
  }
  for (const [, nativeMethod] of passMethods) {
    nativeMethod().mockResolvedValue(nativePassCheckResult);
  }
  nativeQueueIt.showQueueAsync.mockResolvedValue({
    queueittoken: 'shown',
    state: 'Passed',
  });
  nativeQueueIt.onWebViewEvent.mockImplementation(() => ({
    remove: jest.fn(),
  }));
});

afterEach(() => {
  QueueIt.offAll();
});

it.each(runMethods)(
  'Given_PaddedDomainAndPrefix_When_%s_Then_NativeReceivesTrimmedDomainAndPrefixAfterLanguage',
  async (_name, nativeMethod, call, leading) => {
    await call('layout', 'en-US', {
      waitingRoomDomain: '  queue.example.com  ',
      queuePathPrefix: ' waitingroom ',
    });

    expect(nativeMethod().mock.calls).toStrictEqual([
      [
        ...leading,
        'layout',
        'en-US',
        'queue.example.com',
        'waitingroom',
        undefined,
      ],
    ]);
  }
);

it.each(nativeMethods)(
  'Given_PaddedDomainPrefixAndInviteCode_When_%s_Then_NativeReceivesTrimmedValuesInOrderAfterLanguage',
  async (_name, nativeMethod, call, leading) => {
    await call('layout', 'en-US', {
      waitingRoomDomain: '  queue.example.com  ',
      queuePathPrefix: ' waitingroom ',
      inviteCode: '  INVITE  ',
    });

    expect(nativeMethod().mock.calls).toStrictEqual([
      [
        ...leading,
        'layout',
        'en-US',
        'queue.example.com',
        'waitingroom',
        'INVITE',
      ],
    ]);
  }
);

it.each(nativeMethods)(
  'Given_DomainWithoutPrefix_When_%s_Then_NativeReceivesDomainAndNoPrefix',
  async (_name, nativeMethod, call, leading) => {
    await call('layout', 'en-US', { waitingRoomDomain: 'queue.example.com' });

    expect(nativeMethod().mock.calls).toStrictEqual([
      [
        ...leading,
        'layout',
        'en-US',
        'queue.example.com',
        undefined,
        undefined,
      ],
    ]);
  }
);

it.each(nativeMethods)(
  'Given_DomainAndBlankPrefix_When_%s_Then_NativeReceivesDomainAndNoPrefix',
  async (_name, nativeMethod, call, leading) => {
    await call('layout', 'en-US', {
      waitingRoomDomain: 'queue.example.com',
      queuePathPrefix: '   ',
    });

    expect(nativeMethod().mock.calls).toStrictEqual([
      [
        ...leading,
        'layout',
        'en-US',
        'queue.example.com',
        undefined,
        undefined,
      ],
    ]);
  }
);

describe.each(['', '   '])('with domain %j', (domain) => {
  it.each(nativeMethods)(
    'Given_EmptyOrBlankDomainAndPrefix_When_%s_Then_NativeReceivesNoDomainAndNoPrefix',
    async (_name, nativeMethod, call, leading) => {
      await call('layout', 'en-US', {
        waitingRoomDomain: domain,
        queuePathPrefix: 'waitingroom',
      });

      expect(nativeMethod().mock.calls).toStrictEqual([
        [...leading, 'layout', 'en-US', undefined, undefined, undefined],
      ]);
    }
  );
});

it.each(nativeMethods)(
  'Given_PrefixWithoutDomain_When_%s_Then_NativeReceivesNoDomainAndNoPrefix',
  async (_name, nativeMethod, call, leading) => {
    await call('layout', 'en-US', { queuePathPrefix: 'waitingroom' });

    expect(nativeMethod().mock.calls).toStrictEqual([
      [...leading, 'layout', 'en-US', undefined, undefined, undefined],
    ]);
  }
);

it.each(nativeMethods)(
  'Given_InviteCodeWithoutDomain_When_%s_Then_NativeStillReceivesTheInviteCode',
  async (_name, nativeMethod, call, leading) => {
    await call('layout', 'en-US', {
      queuePathPrefix: 'waitingroom',
      inviteCode: 'INVITE',
    });

    expect(nativeMethod().mock.calls).toStrictEqual([
      [...leading, 'layout', 'en-US', undefined, undefined, 'INVITE'],
    ]);
  }
);

describe.each(['', '   '])('with invite code %j', (inviteCode) => {
  it.each(nativeMethods)(
    'Given_EmptyOrBlankInviteCode_When_%s_Then_NativeReceivesNoInviteCode',
    async (_name, nativeMethod, call, leading) => {
      await call('layout', 'en-US', {
        waitingRoomDomain: 'queue.example.com',
        inviteCode,
      });

      expect(nativeMethod().mock.calls).toStrictEqual([
        [
          ...leading,
          'layout',
          'en-US',
          'queue.example.com',
          undefined,
          undefined,
        ],
      ]);
    }
  );
});

it.each(runMethods)(
  'Given_LayoutNameAndLanguageWithoutOptions_When_%s_Then_NativeReceivesLeadingArgumentsInOrderThenNoDomainAndNoPrefixAndResultIsMapped',
  async (_name, nativeMethod, call, leading) => {
    const result = await call('layout', 'en-US');

    expect(nativeMethod().mock.calls).toStrictEqual([
      [...leading, 'layout', 'en-US', undefined, undefined, undefined],
    ]);
    expect(result).toEqual({ QueueITToken: 'qtoken', State: 'Passed' });
  }
);

describe('pass check', () => {
  const tryPassWithRedirectType = async (redirectType: string) => {
    nativeQueueIt.tryPassAsync.mockResolvedValueOnce({
      ...nativePassCheckResult,
      redirectType,
    });
    return QueueIt.tryPass('customer', 'event');
  };

  it.each(passMethods)(
    'Given_NativePassCheckResult_When_%s_Then_ResultCarriesEveryFieldAndTheNormalisedCheckValues',
    async (_name, nativeMethod, call) => {
      nativeMethod().mockResolvedValueOnce({
        ...nativePassCheckResult,
        redirectType: 'safetyNet',
      });

      expect(
        await call('layout', 'en-US', {
          waitingRoomDomain: ' queue.example.com ',
          queuePathPrefix: ' waitingroom ',
        })
      ).toStrictEqual({
        QueueITToken: 'ptoken',
        QueueUrl: 'https://q.example/queue',
        TargetUrl: 'https://t.example/target',
        UrlTTLInMinutes: 5,
        RedirectType: 'safetyNet',
        State: 'Passed',
        CustomerId: 'customer',
        EventOrAliasId: 'event',
        WaitingRoomDomain: 'queue.example.com',
        QueuePathPrefix: 'waitingroom',
      });
    }
  );

  it.each(passMethods)(
    'Given_NoDomainAndPrefix_When_%s_Then_ResultHasNoDomainOrPrefixMember',
    async (_name, _nativeMethod, call) => {
      const result = (await call()) as QueueItTryPassResult;

      expect('WaitingRoomDomain' in result).toBe(false);
      expect('QueuePathPrefix' in result).toBe(false);
    }
  );

  it.each([
    ['safetyNet', 'safetyNet', TryPassState.Passed],
    ['directLink', 'directLink', TryPassState.Passed],
    ['disabled', 'disabled', TryPassState.Disabled],
    ['afterEvent', 'afterEvent', TryPassState.Disabled],
    ['idle', 'idle', TryPassState.Disabled],
    ['queue', 'queue', TryPassState.Passed],
    ['unknown', 'unknown', TryPassState.Passed],
    ['safetynet', 'safetyNet', TryPassState.Passed],
    ['afterevent', 'afterEvent', TryPassState.Disabled],
    ['DIRECTLINK', 'directLink', TryPassState.Passed],
    ['debug', 'unknown', TryPassState.Passed],
    ['bypass', 'unknown', TryPassState.Passed],
  ])(
    'Given_NativeRedirectType_%s_When_tryPass_Then_RedirectTypeIs_%s_AndStateIs_%s',
    async (nativeRedirectType, redirectType, state) => {
      const result = await tryPassWithRedirectType(nativeRedirectType);

      expect(result.RedirectType).toBe(redirectType);
      expect(result.State).toBe(state);
      expect(result.QueueITToken).toBe('ptoken');
    }
  );

  it.each([
    ['queue', 'queue', TryPassState.Queue],
    ['unknown', 'unknown', TryPassState.Queue],
    ['debug', 'unknown', TryPassState.Queue],
    ['bypass', 'unknown', TryPassState.Queue],
    ['safetyNet', 'safetyNet', TryPassState.Passed],
    ['directLink', 'directLink', TryPassState.Passed],
    ['disabled', 'disabled', TryPassState.Disabled],
    ['afterEvent', 'afterEvent', TryPassState.Disabled],
    ['idle', 'idle', TryPassState.Disabled],
  ])(
    'Given_NativeRedirectType_%s_WithQueueUrlAndNoToken_When_tryPass_Then_RedirectTypeIs_%s_AndStateIs_%s',
    async (redirectType, mappedRedirectType, state) => {
      nativeQueueIt.tryPassAsync.mockResolvedValueOnce({
        ...nativePassCheckResult,
        queueittoken: '',
        redirectType,
      });

      const result = await QueueIt.tryPass('customer', 'event');

      expect(result.RedirectType).toBe(mappedRedirectType);
      expect(result.State).toBe(state);
      expect(result.QueueITToken).toBe('');
    }
  );

  it.each(passMethods)(
    'Given_NativeResultWithQueueUrlAndOtherFieldsAbsent_When_%s_Then_AbsentStringsAreEmptyAndTtlIsZero',
    async (_name, nativeMethod, call) => {
      nativeMethod().mockResolvedValueOnce({
        queueittoken: null,
        queueUrl: 'https://q.example/queue',
        targetUrl: null,
        urlTTLInMinutes: null,
        redirectType: 'safetyNet',
      });

      expect(await call()).toMatchObject({
        QueueITToken: '',
        QueueUrl: 'https://q.example/queue',
        TargetUrl: '',
        UrlTTLInMinutes: 0,
        State: 'Passed',
      });
    }
  );

  describe.each([
    ['null', null],
    ['undefined', undefined],
    [
      'an answer with an empty token and queue URL',
      {
        queueittoken: '',
        queueUrl: '',
        targetUrl: '',
        urlTTLInMinutes: 0,
        redirectType: 'unknown',
      },
    ],
    [
      'an answer with an absent token and queue URL',
      {
        queueittoken: null,
        queueUrl: null,
        targetUrl: null,
        urlTTLInMinutes: null,
        redirectType: 'safetyNet',
      },
    ],
  ])('when native resolves %s', (_description, nativeResult) => {
    it.each(passMethods)(
      'Given_NativeResultWithoutTokenOrQueueUrl_When_%s_Then_RejectsWithAPlainNoResultError',
      async (_name, nativeMethod, call) => {
        nativeMethod().mockResolvedValueOnce(nativeResult);

        const error = await call().then(
          () => undefined,
          (reason: unknown) => reason
        );

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(noResultMessage);
        expect('code' in (error as Error)).toBe(false);
        expect('userInfo' in (error as Error)).toBe(false);
      }
    );
  });

  describe.each([
    ['token', { queueUrl: '' }],
    ['queue URL', { queueittoken: '' }],
  ])('with only the %s', (_description, emptied) => {
    it.each(passMethods)(
      'Given_NativeResultWithTokenOrQueueUrl_When_%s_Then_Resolves',
      async (_name, nativeMethod, call) => {
        nativeMethod().mockResolvedValueOnce({
          ...nativePassCheckResult,
          ...emptied,
        });

        await expect(call()).resolves.toMatchObject({
          CustomerId: 'customer',
        });
      }
    );
  });

  it.each(passMethods)(
    'Given_NativeUnavailableWithErrorCode_When_%s_Then_ResultIsUnavailableWithTheErrorCode',
    async (_name, nativeMethod, call) => {
      nativeMethod().mockResolvedValueOnce({
        queueittoken: '',
        state: 'Unavailable',
        errorCode: 'NO_CONNECTION',
      });

      expect(await call()).toStrictEqual({
        QueueITToken: '',
        QueueUrl: '',
        TargetUrl: '',
        UrlTTLInMinutes: 0,
        RedirectType: 'unknown',
        State: 'Unavailable',
        ErrorCode: 'NO_CONNECTION',
        CustomerId: 'customer',
        EventOrAliasId: 'event',
      });
    }
  );

  it.each(passMethods)(
    'Given_NativeUnavailableWithoutErrorCode_When_%s_Then_ResultHasNoErrorCodeMember',
    async (_name, nativeMethod, call) => {
      nativeMethod().mockResolvedValueOnce({
        queueittoken: null,
        state: 'Unavailable',
      });

      const result = (await call()) as QueueItTryPassResult;

      expect(result.State).toBe('Unavailable');
      expect('ErrorCode' in result).toBe(false);
    }
  );

  it.each(passMethods)(
    'Given_NativeRejectionWithErrorCode_When_%s_Then_CallerReceivesTheErrorCodeInUserInfo',
    async (_name, nativeMethod, call) => {
      nativeMethod().mockRejectedValueOnce(
        Object.assign(new Error('api failed'), {
          code: 'error',
          userInfo: { errorCode: 'API_ERROR' },
        })
      );

      await expect(call()).rejects.toMatchObject({
        message: 'api failed',
        userInfo: { errorCode: 'API_ERROR' },
      });
    }
  );

  it.each([
    [
      'tryPassWithEnqueueToken',
      () => QueueIt.tryPassWithEnqueueToken('customer', 'event', ''),
      () => nativeQueueIt.tryPassWithEnqueueTokenAsync,
      'EnqueueToken cannot be empty',
    ],
    [
      'tryPassWithEnqueueKey',
      () => QueueIt.tryPassWithEnqueueKey('customer', 'event', ''),
      () => nativeQueueIt.tryPassWithEnqueueKeyAsync,
      'EnqueueKey cannot be empty',
    ],
  ])(
    'Given_EmptyEnqueueValue_When_%s_Then_RejectsWithoutCallingNative',
    async (_name, call, nativeMethod, message) => {
      await expect(call()).rejects.toThrow(message);

      expect(nativeMethod()).not.toHaveBeenCalled();
    }
  );
});

describe('showQueue', () => {
  beforeEach(() => {
    nativeQueueIt.tryPassAsync.mockResolvedValue({
      ...nativePassCheckResult,
      queueittoken: '',
    });
  });

  const queueResult = (): Promise<QueueItTryPassResult> =>
    QueueIt.tryPass('customer', 'event', undefined, undefined, {
      waitingRoomDomain: 'queue.example.com',
      queuePathPrefix: 'waitingroom',
    });

  it.each([
    ['safetyNet', 'Passed'],
    ['directLink', 'Passed'],
    ['disabled', 'Disabled'],
    ['afterEvent', 'Disabled'],
    ['idle', 'Disabled'],
    ['queue', 'Passed'],
    ['unknown', 'Passed'],
  ])(
    'Given_PassCheckWithRedirectType_%s_When_showQueue_Then_ResolvesState_%s_WithTokenAndNoNativeCall',
    async (redirectType, state) => {
      nativeQueueIt.tryPassAsync.mockResolvedValueOnce({
        ...nativePassCheckResult,
        redirectType,
      });
      const result = await QueueIt.tryPass('customer', 'event');

      expect(await QueueIt.showQueue(result)).toStrictEqual({
        QueueITToken: 'ptoken',
        State: state,
      });
      expect(nativeQueueIt.showQueueAsync).not.toHaveBeenCalled();
    }
  );

  it('Given_UnavailablePassCheckWithErrorCode_When_showQueue_Then_ResolvesUnavailableWithErrorCodeAndNoNativeCall', async () => {
    nativeQueueIt.tryPassAsync.mockResolvedValueOnce({
      queueittoken: '',
      state: 'Unavailable',
      errorCode: 'NO_CONNECTION',
    });
    const result = await QueueIt.tryPass('customer', 'event');

    expect(await QueueIt.showQueue(result)).toStrictEqual({
      QueueITToken: '',
      State: 'Unavailable',
      ErrorCode: 'NO_CONNECTION',
    });
    expect(nativeQueueIt.showQueueAsync).not.toHaveBeenCalled();
  });

  it('Given_UnavailablePassCheckWithoutErrorCode_When_showQueue_Then_ResolvesUnavailableWithoutErrorCode', async () => {
    nativeQueueIt.tryPassAsync.mockResolvedValueOnce({
      queueittoken: '',
      state: 'Unavailable',
    });
    const result = await QueueIt.tryPass('customer', 'event');

    expect(await QueueIt.showQueue(result)).toStrictEqual({
      QueueITToken: '',
      State: 'Unavailable',
    });
  });

  it('Given_QueueResult_When_showQueue_Then_NativeReceivesTheResultFieldsInOrder', async () => {
    const result = await queueResult();

    await QueueIt.showQueue(result);

    expect(nativeQueueIt.showQueueAsync.mock.calls).toStrictEqual([
      [
        'customer',
        'event',
        'https://q.example/queue',
        'https://t.example/target',
        '',
        5,
        'queue.example.com',
        'waitingroom',
      ],
    ]);
  });

  it('Given_QueueResultWithPaddedDomainAndPrefix_When_showQueue_Then_NativeReceivesTrimmedDomainAndPrefix', async () => {
    const result = await queueResult();

    await QueueIt.showQueue({
      ...result,
      WaitingRoomDomain: '  queue.example.com  ',
      QueuePathPrefix: ' waitingroom ',
    });

    expect(nativeQueueIt.showQueueAsync.mock.calls[0].slice(6)).toStrictEqual([
      'queue.example.com',
      'waitingroom',
    ]);
  });

  it.each([
    ['BlankDomainAndPrefix', '   '],
    ['PrefixWithoutDomain', undefined],
  ])(
    'Given_QueueResultWith%s_When_showQueue_Then_NativeReceivesNoDomainAndNoPrefix',
    async (_case, domain) => {
      const result = await queueResult();

      await QueueIt.showQueue({
        ...result,
        WaitingRoomDomain: domain,
        QueuePathPrefix: 'waitingroom',
      });

      expect(nativeQueueIt.showQueueAsync.mock.calls[0].slice(6)).toStrictEqual(
        [undefined, undefined]
      );
    }
  );

  it('Given_QueueResultWithNonStringDomain_When_showQueue_Then_RejectsWithTypeErrorWithoutCallingNative', async () => {
    const result = await queueResult();

    await expect(
      QueueIt.showQueue({
        ...result,
        WaitingRoomDomain: 123 as unknown as string,
      })
    ).rejects.toBeInstanceOf(TypeError);

    expect(nativeQueueIt.showQueueAsync).not.toHaveBeenCalled();
  });

  it('Given_PassedResultWithNonStringDomain_When_showQueue_Then_ResolvesWithoutCallingNative', async () => {
    nativeQueueIt.tryPassAsync.mockResolvedValueOnce({
      ...nativePassCheckResult,
      redirectType: 'safetyNet',
    });
    const result = await QueueIt.tryPass('customer', 'event');

    expect(
      await QueueIt.showQueue({
        ...result,
        WaitingRoomDomain: 123 as unknown as string,
      })
    ).toStrictEqual({ QueueITToken: 'ptoken', State: 'Passed' });
    expect(nativeQueueIt.showQueueAsync).not.toHaveBeenCalled();
  });

  it('Given_QueueResultWithoutDomainAndPrefix_When_showQueue_Then_NativeReceivesNoDomainAndNoPrefix', async () => {
    const result = await QueueIt.tryPass('customer', 'event');

    await QueueIt.showQueue(result);

    expect(nativeQueueIt.showQueueAsync.mock.calls).toStrictEqual([
      [
        'customer',
        'event',
        'https://q.example/queue',
        'https://t.example/target',
        '',
        5,
        undefined,
        undefined,
      ],
    ]);
  });

  it('Given_ResultCopiedWithEditedQueueUrl_When_showQueue_Then_NativeReceivesTheEditedUrlUnchanged', async () => {
    const result = await queueResult();
    const edited = 'https://q.example/queue?extra=1&other=%20x';

    await QueueIt.showQueue({ ...result, QueueUrl: edited });

    expect(nativeQueueIt.showQueueAsync.mock.calls[0][2]).toBe(edited);
  });

  it('Given_NativeShowResult_When_showQueue_Then_ResolvesTheMappedResult', async () => {
    nativeQueueIt.showQueueAsync.mockResolvedValueOnce({
      queueittoken: 'shown',
      state: 'Unavailable',
      errorCode: 'NO_CONNECTION',
    });

    expect(await QueueIt.showQueue(await queueResult())).toStrictEqual({
      QueueITToken: 'shown',
      State: 'Unavailable',
      ErrorCode: 'NO_CONNECTION',
    });
  });

  it('Given_ListenersRegisteredThroughOnAndOnceAndQueueResultWithEmptyQueueUrl_When_showQueue_Then_RejectsAndListenersKeepReceivingEvents', async () => {
    const result = await queueResult();
    const { nativeRemove, emit, callCounts } =
      subscribeThroughOnAndOnce(listenedEvents);

    await expect(
      QueueIt.showQueue({ ...result, QueueUrl: '' })
    ).rejects.toThrow('QueueUrl cannot be empty');

    expect(nativeQueueIt.showQueueAsync).not.toHaveBeenCalled();
    expect(nativeRemove).not.toHaveBeenCalled();
    emit(...listenedEvents);
    expect(callCounts()).toStrictEqual([1, 1, 1, 1, 1, 1]);
  });

  it('Given_ListenersRegisteredThroughOnAndOnceAndNativeShowRejects_When_showQueue_Then_RethrowsAndListenersKeepReceivingEvents', async () => {
    const result = await queueResult();
    const { nativeRemove, emit, callCounts } =
      subscribeThroughOnAndOnce(listenedEvents);
    const failure = Object.assign(new Error('show failed'), {
      userInfo: { errorCode: 'API_ERROR' },
    });
    nativeQueueIt.showQueueAsync.mockRejectedValueOnce(failure);

    await expect(QueueIt.showQueue(result)).rejects.toBe(failure);

    expect(nativeRemove).not.toHaveBeenCalled();
    emit(...listenedEvents);
    expect(callCounts()).toStrictEqual([1, 1, 1, 1, 1, 1]);
  });
});

it.each(runMethods)(
  'Given_ListenersRegisteredThroughOnAndOnce_When_%s_Then_RejectedRunRethrowsAndListenersKeepReceivingEvents',
  async (_name, nativeMethod, call) => {
    const { nativeRemove, emit, callCounts } =
      subscribeThroughOnAndOnce(listenedEvents);
    const failure = new Error('run failed');
    nativeMethod().mockRejectedValueOnce(failure);

    await expect(call()).rejects.toBe(failure);

    expect(nativeRemove).not.toHaveBeenCalled();
    emit(...listenedEvents);
    expect(callCounts()).toStrictEqual([1, 1, 1, 1, 1, 1]);
  }
);

it.each(runMethods)(
  'Given_ListenersRegisteredThroughOnAndOnceAndNonStringDomain_When_%s_Then_RejectsWithTypeErrorAndListenersKeepReceivingEvents',
  async (_name, nativeMethod, call) => {
    const { nativeRemove, emit, callCounts } =
      subscribeThroughOnAndOnce(listenedEvents);

    await expect(
      call(undefined, undefined, {
        waitingRoomDomain: 123,
      } as unknown as QueueItRunOptions)
    ).rejects.toBeInstanceOf(TypeError);

    expect(nativeMethod()).not.toHaveBeenCalled();
    expect(nativeRemove).not.toHaveBeenCalled();
    emit(...listenedEvents);
    expect(callCounts()).toStrictEqual([1, 1, 1, 1, 1, 1]);
  }
);

describe('offAll', () => {
  const twoEventTypes = ['openingQueueView', 'webViewClosed'];

  it('Given_OnAndOnceListenersOnTwoEventTypes_When_offAllWithOneType_Then_OnlyThatTypeIsRemovedAndTheOtherKeepsReceivingEvents', () => {
    const { nativeRemove, emit, callCounts } =
      subscribeThroughOnAndOnce(twoEventTypes);

    QueueIt.offAll('openingQueueView');

    expect(nativeRemove).toHaveBeenCalledTimes(2);
    emit(...twoEventTypes);
    expect(callCounts()).toStrictEqual([0, 0, 1, 1]);
  });

  it.each([
    ['NoArgument', () => QueueIt.offAll()],
    ['Undefined', () => QueueIt.offAll(undefined)],
  ])(
    'Given_OnAndOnceListenersOnTwoEventTypes_When_offAllWith%s_Then_EveryListenerIsRemoved',
    (_case, offAll) => {
      const { nativeRemove, emit, callCounts } =
        subscribeThroughOnAndOnce(twoEventTypes);

      offAll();

      expect(nativeRemove).toHaveBeenCalledTimes(4);
      emit(...twoEventTypes);
      expect(callCounts()).toStrictEqual([0, 0, 0, 0]);
    }
  );

  it('Given_OnListener_When_ItsSubscriptionIsRemovedTwiceThenOffAll_Then_TheNativeListenerIsRemovedOnceAndItsRecordIsDropped', () => {
    const { nativeRemove } = subscribeThroughOnAndOnce([]);
    const sub = QueueIt.on('webViewClosed', jest.fn());

    sub.remove();
    sub.remove();

    expect(subsOf(QueueIt)).toStrictEqual([]);
    QueueIt.offAll();
    expect(nativeRemove).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['OldArchitecture', true],
    ['NoOnceAsyncFallback', false],
  ])(
    'Given_%sOnListener_When_ItsSubscriptionIsRemoved_Then_ItsRecordIsDroppedAndItGetsNoEvents',
    async (_case, withOnceAsync) => {
      const pending: (() => void)[] = [];
      const native = nativeQueueIt as {
        onWebViewEvent?: jest.Mock;
        onceAsync?: () => Promise<undefined>;
      };
      const onWebViewEvent = native.onWebViewEvent;
      if (withOnceAsync) {
        native.onceAsync = () =>
          new Promise<undefined>((resolve) =>
            pending.push(() => resolve(undefined))
          );
      }
      let engine!: typeof QueueIt;
      jest.isolateModules(() => {
        delete native.onWebViewEvent;
        engine = (require('../index') as typeof import('../index')).QueueIt;
        native.onWebViewEvent = onWebViewEvent;
      });
      try {
        const listener = jest.fn();

        engine.on('webViewClosed', listener).remove();
        pending.splice(0).forEach((resolve) => resolve());
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(subsOf(engine)).toStrictEqual([]);
        expect(listener).not.toHaveBeenCalled();
      } finally {
        engine.offAll();
        delete native.onceAsync;
      }
    }
  );

  it('Given_OldArchitectureOnAndOnceListenersOnTwoEventTypes_When_offAllWithOneType_Then_OnlyTheOtherTypeKeepsReceivingEvents', async () => {
    const pending: (() => void)[] = [];
    const native = nativeQueueIt as {
      onWebViewEvent?: jest.Mock;
      onceAsync?: () => Promise<undefined>;
    };
    const onWebViewEvent = native.onWebViewEvent;
    native.onceAsync = () =>
      new Promise<undefined>((resolve) =>
        pending.push(() => resolve(undefined))
      );
    let engine!: typeof QueueIt;
    jest.isolateModules(() => {
      delete native.onWebViewEvent;
      engine = (require('../index') as typeof import('../index')).QueueIt;
      native.onWebViewEvent = onWebViewEvent;
    });
    try {
      const callCounts = registerOnAndOnce(engine, twoEventTypes);

      engine.offAll('openingQueueView');
      pending.splice(0).forEach((resolve) => resolve());
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(callCounts()).toStrictEqual([0, 0, 1, 1]);
    } finally {
      engine.offAll();
      delete native.onceAsync;
    }
  });
});

it('Given_TheExportedEngine_When_enableTesting_Then_NoSuchMemberExists', () => {
  expect('enableTesting' in QueueIt).toBe(false);
  // @ts-expect-error
  expect(() => QueueIt.enableTesting(true)).toThrow(TypeError);
});

describe('notification details', () => {
  let emit: (event: { name: string; details?: { url: string } }) => void;

  beforeEach(() => {
    nativeQueueIt.onWebViewEvent.mockImplementation((callback) => {
      emit = callback;
      return { remove: jest.fn() };
    });
  });

  it('Given_NotificationWithDetails_When_on_Then_ListenerReceivesTheDetails', () => {
    const listener = jest.fn();
    QueueIt.on('queueUrlChanged', listener);

    emit({ name: 'queueUrlChanged', details: { url: 'https://q.example/' } });

    expect(listener.mock.calls).toStrictEqual([
      [{ url: 'https://q.example/' }],
    ]);
  });

  it('Given_NotificationWithDetails_When_once_Then_ListenerReceivesTheDetailsOnce', () => {
    const listener = jest.fn();
    QueueIt.once('queueUrlChanged', listener);

    emit({ name: 'queueUrlChanged', details: { url: 'https://q.example/' } });
    emit({ name: 'queueUrlChanged', details: { url: 'https://r.example/' } });

    expect(listener.mock.calls).toStrictEqual([
      [{ url: 'https://q.example/' }],
    ]);
  });

  it('Given_NotificationWithoutDetails_When_on_Then_ListenerIsCalledWithNoDetails', () => {
    const listener = jest.fn();
    QueueIt.on('webViewClosed', listener);

    emit({ name: 'webViewClosed' });

    expect(listener.mock.calls).toStrictEqual([[undefined]]);
  });

  it('Given_NotificationOfAnotherName_When_on_Then_ListenerIsNotCalled', () => {
    const listener = jest.fn();
    QueueIt.on('openingQueueView', listener);

    emit({ name: 'queueUrlChanged', details: { url: 'https://q.example/' } });

    expect(listener).not.toHaveBeenCalled();
  });
});

it.each(runMethods)(
  'Given_NativeResultWithErrorCode_When_%s_Then_ResultCarriesTheErrorCode',
  async (_name, nativeMethod, call) => {
    nativeMethod().mockResolvedValueOnce({
      queueittoken: '',
      state: 'Unavailable',
      errorCode: 'NO_CONNECTION',
    });

    expect(await call()).toStrictEqual({
      QueueITToken: '',
      State: 'Unavailable',
      ErrorCode: 'NO_CONNECTION',
    });
  }
);

it.each(runMethods)(
  'Given_NativeResultWithoutErrorCode_When_%s_Then_ResultHasNoErrorCodeMember',
  async (_name, nativeMethod, call) => {
    nativeMethod().mockResolvedValueOnce({
      queueittoken: 'qtoken',
      state: 'Passed',
      errorCode: null,
    });

    expect(await call()).toStrictEqual({
      QueueITToken: 'qtoken',
      State: 'Passed',
    });
  }
);

it.each(runMethods)(
  'Given_NativeRejectionWithErrorCode_When_%s_Then_CallerReceivesTheErrorCodeInUserInfo',
  async (_name, nativeMethod, call) => {
    nativeMethod().mockRejectedValueOnce(
      Object.assign(new Error('api failed'), {
        code: 'error',
        userInfo: { errorCode: 'API_ERROR' },
      })
    );

    await expect(call()).rejects.toMatchObject({
      code: 'error',
      message: 'api failed',
      userInfo: { errorCode: 'API_ERROR' },
    });
  }
);

describe('platform availability', () => {
  const setDevelopmentBuild = (isDevelopment: boolean) => {
    (global as unknown as { __DEV__: boolean }).__DEV__ = isDevelopment;
  };

  function loadFreshEngine(
    os: 'ios' | 'android',
    nativeRemove: jest.Mock = jest.fn()
  ) {
    let fresh!: typeof QueueIt;
    jest.isolateModules(() => {
      require('react-native').Platform.OS = os;
      require('../specs/NativeQueueIt').default.onWebViewEvent.mockImplementation(
        () => ({ remove: nativeRemove })
      );
      fresh = (require('../index') as typeof import('../index')).QueueIt;
    });
    return fresh;
  }

  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    setDevelopmentBuild(true);
  });

  it.each([
    ['userExited', false],
    ['unknownEvent', false],
    ['openingQueueView', true],
    ['webViewClosed', true],
    ['queueUrlChanged', true],
  ])(
    'Given_AndroidAndEvent_%s_When_isEventAvailable_Then_Returns_%s',
    (event, expected) => {
      expect(loadFreshEngine('android').isEventAvailable(event)).toBe(expected);
    }
  );

  it.each([
    ['userExited', true],
    ['unknownEvent', false],
    ['openingQueueView', true],
    ['webViewClosed', true],
    ['queueUrlChanged', true],
  ])(
    'Given_IosAndEvent_%s_When_isEventAvailable_Then_Returns_%s',
    (event, expected) => {
      expect(loadFreshEngine('ios').isEventAvailable(event)).toBe(expected);
    }
  );

  it('Given_AndroidInDevelopment_When_onAndOnceSubscribeToUserExited_Then_OneWarningIsLoggedAndRemoveWorks', () => {
    const nativeRemove = jest.fn();
    const engine = loadFreshEngine('android', nativeRemove);

    const subscription = engine.on('userExited', () => {});
    engine.once('userExited', () => {});

    expect(warn).toHaveBeenCalledTimes(1);
    expect(nativeRemove).not.toHaveBeenCalled();
    subscription.remove();
    expect(nativeRemove).toHaveBeenCalledTimes(1);
  });

  it('Given_AndroidInDevelopment_When_onceSubscribesToUserExited_Then_OneWarningIsLogged', () => {
    const engine = loadFreshEngine('android');

    engine.once('userExited', () => {});

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('Given_IosInDevelopment_When_onAndOnceSubscribeToUserExited_Then_NoWarningIsLogged', () => {
    const engine = loadFreshEngine('ios');

    engine.on('userExited', () => {});
    engine.once('userExited', () => {});

    expect(warn).not.toHaveBeenCalled();
  });

  it('Given_AndroidInProductionBuild_When_onSubscribesToUserExited_Then_NoWarningIsLogged', () => {
    setDevelopmentBuild(false);
    const engine = loadFreshEngine('android');

    engine.on('userExited', () => {});

    expect(warn).not.toHaveBeenCalled();
  });

  it('Given_AndroidInDevelopment_When_onSubscribesToAnAvailableEvent_Then_NoWarningIsLogged', () => {
    const engine = loadFreshEngine('android');

    engine.on('queueUrlChanged', () => {});

    expect(warn).not.toHaveBeenCalled();
  });
});
