from setuptools import setup, find_packages

setup(
    name="ipv6poetry",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "nltk>=3.6.0",
        "ipaddress>=1.0.0",
    ],
    entry_points={
        'console_scripts': [
            'ipv6poetry=ipv6poetry.cli:main',
        ],
    },
    author="IPv6 Poetry Project",
    author_email="user@example.com",
    description="Tools for converting IPv6 addresses to poetic phrases and back",
    keywords="ipv6, poetry, converter",
    python_requires=">=3.6",
    tests_require=[
        "pytest>=7.0.0",
        "pytest-cov>=4.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
        ],
    },
)