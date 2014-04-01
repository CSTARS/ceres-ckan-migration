create table package_keep(
offtopic varchar(20),
in_atlas char,
groupname text,
title text,
keywords text,
topics text,
date date,
originator text,
publisher text,
links text,
public boolean,
dataset_email text,
group2 text,
agency text
);

\COPY package_keep from package_keep.csv with CSV header