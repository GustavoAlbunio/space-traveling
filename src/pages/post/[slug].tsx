import { ReactElement, useEffect } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import commonStyles from '../../styles/common.module.scss';
import Header from '../../components/Header';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): ReactElement {
  const router = useRouter();

  const words = post.data.content.reduce((acc, content) => {
    const wordsHeading = content.heading?.split(' ') ?? [];
    const wordsBody = content.body
      .map(
        body =>
          body.text
            .replace(/(\r\n|\n|\r)/g, ' ')
            .trim()
            .replace(/<[^>]*>/g, '')
            .split(' ').length
      )
      .reduce((total, nextWord) => {
        total += nextWord;

        return total;
      }, 0);

    acc += wordsHeading.length;
    acc += wordsBody;

    return acc;
  }, 0);

  return (
    <>
      <Head>
        <title>Post | spacetraveling.</title>
      </Head>
      <Header />
      {router.isFallback ? (
        <span>Carregando...</span>
      ) : (
        <main>
          <img
            className={styles.banner}
            src={post.data.banner.url}
            alt="Banner"
          />
          <article className={`${commonStyles.container} ${styles.content}`}>
            <h1>{post.data.title}</h1>
            <span>
              <time>
                <FiCalendar />
                {format(new Date(post.first_publication_date), 'dd MMM uuuu', {
                  locale: ptBR,
                })}
              </time>
              <span>
                <FiUser /> {post.data.author}
              </span>
              <span>
                <FiClock />
                {Math.ceil(words / 200)} min
              </span>
            </span>
            {post.data.content.map(content => (
              <div className={styles.postContent} key={content.body.length}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </div>
            ))}
          </article>
        </main>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.uid'],
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();

  const { slug } = context.params;

  const postResponse = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: postResponse.uid,
    first_publication_date: postResponse.first_publication_date,
    data: {
      title: postResponse.data.title,
      subtitle: postResponse.data.subtitle,
      banner: {
        url: postResponse.data.banner.url,
      },
      author: postResponse.data.author,
      content: postResponse.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body,
        };
      }),
    },
  };

  return {
    props: { post },
    revalidate: 60 * 30, // 30 minutes
  };
};
