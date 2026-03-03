import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";

// global은 node.js에서의 전역 객체
declare global {
  var __serverPool: Pool | undefined;
}

// HTTP 요청마다 새 DB 커넥션을 여는 것은 비용이 크다. Pool은 재사용하여 성능을 높인다.
const pool =
  global.__serverPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

//   Next.js 개발 서버는 코드 변경 시 모듈을 재실행한다. global에 저장하지 않으면 재실행마다 Pool이 새로 생겨 커넥션이 낭비된다.
// 프로덕션에서는 모듈이 한 번만 실행되므로 global.__serverPool 패턴이 필요 없다
if (process.env.NODE_ENV !== "production") {
  global.__serverPool = pool;
}

// drizzle(pool, { schema })
// schema를 전달하면 db.query.posts.findMany() 같은 API를 사용할 수 있다.
export const db = drizzle(pool, { schema });
