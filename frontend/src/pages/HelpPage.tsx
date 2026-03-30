export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100">도움말</h1>

      {/* 1. 그룹 만들기 / 가입하기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          1. 그룹 만들기 / 가입하기
        </h2>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">그룹이란?</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          그룹은 함께 마작을 치는 사람들끼리 모이는 모임이나 커뮤니티입니다. 그룹을 만들어 멤버를 초대하고, 게임 기록과 랭킹을 함께 관리할 수 있습니다.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">그룹 만들기</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          홈 화면에서 &quot;새 모임 만들기&quot; 버튼을 눌러 그룹을 생성할 수 있습니다. 그룹 이름과 설명을 입력하고, 공개/비공개 여부를 선택하세요. 그룹을 만든 사람은 자동으로 그룹의 소유자(owner)가 됩니다.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">초대 링크로 가입하기</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          비공개 그룹에 가입하려면 그룹 관리자가 공유한 초대 링크를 통해 가입할 수 있습니다. 초대 링크를 브라우저에 입력하면 자동으로 그룹에 가입됩니다.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">공개 그룹 가입하기</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          홈 화면의 공개 모임 목록에서 원하는 그룹의 &quot;가입&quot; 버튼을 눌러 바로 가입할 수 있습니다.
        </p>
      </section>

      {/* 2. 이벤트 관리 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          2. 이벤트 관리
        </h2>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">이벤트란?</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          이벤트는 그룹 내에서 진행되는 일일대회, 리그, 대탁 결과 기록 등 다양한 용도로 활용할 수 있습니다. 게임 기록은 반드시 이벤트에 소속되어 등록됩니다.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">이벤트 만들기</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          그룹 상세 페이지에서 &quot;이벤트 만들기&quot; 버튼을 눌러 새 이벤트를 생성할 수 있습니다. 이벤트 이름과 타입을 지정하세요.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">일반(regular) vs 독립(independent)</h3>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-3 space-y-2">
          <li>
            <strong>일반(regular)</strong>: 이 이벤트의 게임 기록이 그룹 전체 랭킹에 합산됩니다. 정규 리그나 공식 대회에 적합합니다.
          </li>
          <li>
            <strong>독립(independent)</strong>: 이 이벤트의 게임 기록이 그룹 랭킹에 합산되지 않습니다. 연습전이나 친선전에 적합합니다.
          </li>
        </ul>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">이벤트 마감/재개</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          이벤트를 마감하면 더 이상 새로운 게임 기록을 추가할 수 없습니다. 마감된 이벤트는 다시 재개할 수 있습니다. 이벤트 마감/재개는 그룹의 소유자 또는 관리자만 할 수 있습니다.
        </p>
      </section>

      {/* 3. 게임 기록 등록 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          3. 게임 기록 등록
        </h2>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">기록 추가하기</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          이벤트 상세 페이지에서 &quot;기록 추가&quot; 버튼을 눌러 게임 결과를 등록할 수 있습니다.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">점수 입력</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          각 플레이어(동/남/서/북)를 선택하고 최종 점수를 입력합니다. 4명의 점수 합계가 정확히 100,000점이 되어야 합니다. 점수는 음수도 입력 가능합니다.
        </p>
      </section>

      {/* 4. 랭킹 보기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          4. 랭킹 보기
        </h2>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">그룹 랭킹</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          그룹 상세 페이지에서 &quot;랭킹&quot; 버튼을 눌러 그룹 전체 랭킹을 확인할 수 있습니다. 일반(regular) 이벤트의 기록만 랭킹에 반영됩니다.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">기간별 필터</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          랭킹은 일간, 주간, 월간, 전체 기간으로 필터링할 수 있습니다. 좌우 화살표를 눌러 이전/다음 기간으로 이동할 수 있습니다.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">점수 방식 vs 승점 방식</h3>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-3 space-y-2">
          <li>
            <strong>점수 방식</strong>: (최종 점수 - 25,000) / 1,000 + 우마(순위별 보정치)를 합산하여 랭킹을 계산합니다.
          </li>
          <li>
            <strong>승점 방식</strong>: 순위별로 부여된 승점(match point)을 합산하여 랭킹을 계산합니다.
          </li>
        </ul>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          그룹 설정에서 기본 랭킹 방식을 지정할 수 있으며, 이벤트별로 개별 설정도 가능합니다.
        </p>
      </section>

      {/* 5. 개인 성적 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          5. 개인 성적
        </h2>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">성적 확인</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          그룹 상세 페이지의 멤버 목록에서 멤버 이름을 클릭하면 해당 멤버의 개인 성적을 확인할 수 있습니다.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200">이벤트별 필터</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          개인 성적 페이지에서 특정 이벤트를 선택하면 해당 이벤트에서의 성적만 확인할 수 있습니다. &quot;전체&quot;를 선택하면 모든 일반(regular) 이벤트의 합산 성적을 볼 수 있습니다.
        </p>
      </section>
    </div>
  )
}
