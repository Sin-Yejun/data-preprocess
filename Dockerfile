# 1. 베이스 이미지 선택: Node.js 20 버전의 가벼운(slim) 버전을 사용합니다.
FROM node:20-slim

# 2. 앱 디렉토리 생성
WORKDIR /usr/src/app

# 3. package.json과 package-lock.json을 복사하여 의존성을 먼저 설치합니다.
#    이렇게 하면 코드만 변경되었을 때 매번 의존성을 새로 설치하지 않아 효율적입니다.
COPY package*.json ./

# 4. 프로덕션용 의존성만 설치합니다.
RUN npm install --production

# 5. 프로젝트의 나머지 소스 코드를 이미지로 복사합니다.
COPY . .

# 6. 앱이 3000번 포트를 사용한다고 Docker에 알립니다.
#    (위의 코드 수정으로 실제로는 Cloud Run이 지정하는 포트를 사용하게 됩니다.)
EXPOSE 3000

# 7. 컨테이너가 시작될 때 실행할 명령어를 지정합니다.
CMD [ "node", "server.js" ]
